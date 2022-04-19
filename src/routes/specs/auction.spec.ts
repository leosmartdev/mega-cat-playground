import axios from 'axios'
import express, { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../app'
import { AuctionController } from '../../controllers/auction'
import { generateAccessToken } from '../../utils'
import User from '../../models/user.model'
import Auction, { AuctionResponse, AuctionStates } from '../../models/auction'
import { AuctionBid } from '../../models/auctionBid'
import * as emitterModules from '../../socketEmitter'
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

let app: Express
appPromise.then((_app) => {
  app = _app
})
const auctionPayload = {
  offerId: 'offerId1',
  expirationTime: (Date.now() + 2 * 60 * 60 * 1000).toString(), // 2 hours from now
  startingBid: 123
}

const controller = new AuctionController()

describe('Auction', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let userSaved: any

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    userSaved = new User({
      name: 'Test User',
      username: 'testAdminUsername',
      password: '12345678',
      firstName: 'Test User first name',
      lastName: 'Test User last name',
      usernameOrEmail: 'test1@user.com',
      role: 0,
      googleId: ''
    })
    await userSaved.save()
  })

  afterAll(async () => {
    // await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('create', () => {
    let accessToken: string

    beforeEach(async () => {
      accessToken = generateAccessToken({
        _id: userSaved._id,
        role: userSaved.role
      })
    })

    afterEach(async () => {
      await deleteAllAuctions()
    })

    it('should respond with new auction', async () => {
      const res = await request(app)
        .post('/auctions')
        .auth(accessToken, { type: 'bearer' })
        .send(auctionPayload)
        .expect(200)

      const expectedExpiry = new Date(
        parseInt(auctionPayload.expirationTime)
      ).toISOString()

      expect(res.body.expirationTime).toEqual(expectedExpiry)
      expect(res.body.startingBid).toEqual(auctionPayload.startingBid)
      expect(res.body.status).toEqual(AuctionStates.AWAITING)
      expect(res.body.ownerId).toEqual({
        name: userSaved.name,
        username: userSaved.username
      })
      expect(res.body.bids).toEqual([])
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .post('/auctions')
        .send(auctionPayload)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if auction already exist with offerId', async () => {
      await controller.createAuction(
        { user: userSaved } as unknown as express.Request,
        auctionPayload
      )

      const res = await request(app)
        .post('/auctions')
        .auth(accessToken, { type: 'bearer' })
        .send(auctionPayload)
        .expect(403)

      expect(res.text).toEqual(
        `Error: Auction already exists with offerId: ${auctionPayload.offerId}`
      )
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if user is not found', async () => {
      const randomUserId = mongoose.Types.ObjectId()
      const accessTokenCustomUser = generateAccessToken({
        _id: randomUserId.toHexString(),
        role: userSaved.role
      })

      const res = await request(app)
        .post('/auctions')
        .auth(accessTokenCustomUser, { type: 'bearer' })
        .send(auctionPayload)
        .expect(403)

      expect(res.text).toEqual('Error: User not found')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if offerId is missing', async () => {
      const res = await request(app)
        .post('/auctions')
        .auth(accessToken, { type: 'bearer' })
        .send({ ...auctionPayload, offerId: undefined })
        .expect(400)

      expect(res.text).toEqual(`"offerId" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if startingBid is missing', async () => {
      const res = await request(app)
        .post('/auctions')
        .auth(accessToken, { type: 'bearer' })
        .send({ ...auctionPayload, startingBid: undefined })
        .expect(400)

      expect(res.text).toEqual(`"startingBid" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if expirationTime is missing', async () => {
      const res = await request(app)
        .post('/auctions')
        .auth(accessToken, { type: 'bearer' })
        .send({ ...auctionPayload, expirationTime: undefined })
        .expect(400)

      expect(res.text).toEqual(`"expirationTime" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if expirationTime less than 1 hour', async () => {
      const res = await request(app)
        .post('/auctions')
        .auth(accessToken, { type: 'bearer' })
        .send({
          ...auctionPayload,
          expirationTime: (Date.now() + 59 * 60 * 1000).toString() // 59 minutes
        })
        .expect(400)

      expect(res.text).toEqual(`"expirationTime" must be atleast 1 hour`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if expirationTime greater than 30 days', async () => {
      const res = await request(app)
        .post('/auctions')
        .auth(accessToken, { type: 'bearer' })
        .send({
          ...auctionPayload,
          expirationTime: (Date.now() + 31 * 24 * 60 * 60 * 1000).toString() // 31 days
        })
        .expect(400)

      expect(res.text).toEqual(`"expirationTime" must not exceed 30 days`)
      expect(res.body).toEqual({})
    })
  })

  describe('getAll', () => {
    afterEach(async () => {
      await deleteAllAuctions()
    })

    it('should respond with no on going auctions', async () => {
      mockedAxios.get.mockImplementation(() =>
        Promise.resolve({
          data: { result: [] }
        })
      )

      const res = await request(app).get('/auctions').expect(200)

      expect(res.body.data).toEqual([])
      expect(res.body.message).toEqual('There are no ongoing auctions.')
    })

    it('should respond with Forbidden when failed to get offers', async () => {
      const savedAuction = await controller.createAuction(
        { user: userSaved } as unknown as express.Request,
        auctionPayload
      )
      await Auction.findOneAndUpdate(
        { id: savedAuction.id },
        { status: AuctionStates.ON_GOING }
      )

      mockedAxios.get.mockImplementation(() => {
        throw {
          code: 403,
          message: 'Unable to get offers'
        }
      })

      const res = await request(app).get('/auctions').expect(403)

      expect(res.body.message).toEqual('Unable to get offers')
    })

    it('should respond with one on going auction', async () => {
      const savedAuction = await controller.createAuction(
        { user: userSaved } as unknown as express.Request,
        auctionPayload
      )
      await Auction.findOneAndUpdate(
        { id: savedAuction.id },
        { status: AuctionStates.ON_GOING }
      )

      mockedAxios.get.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{ id: auctionPayload.offerId }] }
        })
      )
      const res = await request(app).get('/auctions').expect(200)

      expect(res.body.message).toEqual('Offers was successfully get!')
      expect(res.body.data.length).toEqual(1)
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          auction: expect.objectContaining({
            ...savedAuction,
            ownerId: {
              name: userSaved.name,
              username: userSaved.username
            },
            status: AuctionStates.ON_GOING
          }),
          id: auctionPayload.offerId
        })
      )
    })
  })

  describe('getAllCreatedByUser', () => {
    let accessToken: string

    beforeEach(async () => {
      accessToken = generateAccessToken({
        _id: userSaved._id,
        role: userSaved.role
      })
    })

    afterEach(async () => {
      await deleteAllAuctions()
    })

    it('should respond with no auctions created by user', async () => {
      const res = await request(app)
        .get('/auctions/user')
        .auth(accessToken, { type: 'bearer' })
        .expect(200)

      expect(res.body.message).toEqual('No auction created by user.')
      expect(res.body.data).toEqual([])
    })

    it('should respond with Forbidden when failed to get offers', async () => {
      const savedAuction = await controller.createAuction(
        { user: userSaved } as unknown as express.Request,
        auctionPayload
      )
      await Auction.findOneAndUpdate(
        { id: savedAuction.id },
        { status: AuctionStates.ON_GOING }
      )
      mockedAxios.get.mockImplementation(() => {
        throw {
          code: 403,
          message: 'Unable to get offers'
        }
      })

      const res = await request(app)
        .get('/auctions/user')
        .auth(accessToken, { type: 'bearer' })
        .expect(403)

      expect(res.body.message).toEqual('Unable to get offers')
    })

    it('should respond with One auction created by user', async () => {
      const savedAuction = await controller.createAuction(
        { user: userSaved } as unknown as express.Request,
        auctionPayload
      )

      mockedAxios.get.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{ id: auctionPayload.offerId }] }
        })
      )
      const res = await request(app)
        .get('/auctions/user')
        .auth(accessToken, { type: 'bearer' })
        .expect(200)

      expect(res.body.message).toEqual('Offers was successfully get!')
      expect(res.body.data.length).toEqual(1)
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          auction: expect.objectContaining({
            ...savedAuction,
            ownerId: {
              name: userSaved.name,
              username: userSaved.username
            }
          }),
          id: auctionPayload.offerId
        })
      )
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app).get('/auctions/user').expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })
  })

  describe('getAllParticipatedByUser', () => {
    let accessToken: string
    const userSavedCustom = new User({
      username: 'someUsername',
      password: '1234567830',
      firstName: 'Test User first name',
      lastName: 'Test User last name',
      usernameOrEmail: 'sometest@user.com',
      role: 0,
      googleId: ''
    })

    beforeEach(async () => {
      accessToken = generateAccessToken({
        _id: userSaved._id,
        role: userSaved.role
      })
      await userSavedCustom.save()
    })

    afterEach(async () => {
      await deleteAllAuctions()
    })

    it('should respond with no auctions participated by user', async () => {
      mockedAxios.get.mockImplementation(() =>
        Promise.resolve({
          data: { result: [] }
        })
      )
      const res = await request(app)
        .get('/auctions/participated')
        .auth(accessToken, { type: 'bearer' })
        .expect(200)

      expect(res.body.message).toEqual(
        'User has not participated in any auction.'
      )
      expect(res.body.data).toEqual([])
    })

    it('should respond with one auction participated by user', async () => {
      mockedAxios.get.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{ id: auctionPayload.offerId }] }
        })
      )
      const auctionSaved = await controller.createAuction(
        { user: userSavedCustom } as unknown as express.Request,
        auctionPayload
      )
      await Auction.findOneAndUpdate(
        { id: auctionSaved.id },
        { status: AuctionStates.ON_GOING }
      )
      await controller.addBid(
        { user: userSaved } as unknown as express.Request,
        auctionSaved.id,
        { bidAmount: 200, ignore: false }
      )

      const res = await request(app)
        .get('/auctions/participated')
        .auth(accessToken, { type: 'bearer' })
        .expect(200)

      expect(res.body.message).toEqual('Offers was successfully get!')
      expect(res.body.data.length).toEqual(1)
      expect(res.body.data[0].auction.bids.length).toEqual(1)
      expect(res.body.data[0].auction.bids[0].userId).toEqual(
        userSaved._id.toString()
      )
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app).get('/auctions/participated').expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if user is not found', async () => {
      const randomUserId = mongoose.Types.ObjectId()
      const accessTokenCustomUser = generateAccessToken({
        _id: randomUserId.toHexString(),
        role: userSaved.role
      })

      const res = await request(app)
        .get('/auctions/participated')
        .auth(accessTokenCustomUser, { type: 'bearer' })
        .expect(403)

      expect(res.body.message).toEqual('User not found')
    })
  })

  describe('getOne', () => {
    afterEach(async () => {
      await deleteAllAuctions()
    })

    it('should respond with a specific auction', async () => {
      mockedAxios.patch.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{}] }
        })
      )
      mockedAxios.post.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{}] }
        })
      )
      mockedAxios.get.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{}] }
        })
      )
      const auction = await controller.createAuction(
        { user: userSaved } as unknown as express.Request,
        auctionPayload
      )
      const auctionId = auction.id
      const res = await request(app).get(`/auctions/${auctionId}`).expect(200)

      expect(res.body.auction.ownerId).toEqual({
        name: userSaved.name,
        username: userSaved.username
      })
      expect(res.body.auction.startingBid).toEqual(auctionPayload.startingBid)
    })

    it('should respond with Forbidden if auction id is not correct', async () => {
      const res = await request(app).get('/auctions/100').expect(403)

      expect(res.body.message).toEqual('Auction not found')
    })
  })

  describe('addBid', () => {
    let accessToken: string
    let auction: AuctionResponse
    const userSavedCustom = new User({
      username: 'testUsername',
      password: '1234567830',
      firstName: 'Test User first name',
      lastName: 'Test User last name',
      usernameOrEmail: 'test2@user.com',
      role: 0,
      googleId: ''
    })

    beforeEach(async () => {
      accessToken = generateAccessToken({
        _id: userSaved._id,
        role: userSaved.role
      })

      auction = await controller.createAuction(
        { user: userSaved } as unknown as express.Request,
        auctionPayload
      )
      await Auction.findOneAndUpdate(
        { id: auction.id },
        { status: AuctionStates.ON_GOING }
      )
      await userSavedCustom.save()
    })

    afterEach(async () => {
      await deleteAllAuctions()
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .post('/auctions/100/bid')
        .send({ bidAmount: 124 })
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Frobidden when wrong auction id is passed', async () => {
      const res = await request(app)
        .post('/auctions/100/bid')
        .auth(accessToken, { type: 'bearer' })
        .send({ bidAmount: 105 })
        .expect(403)
      expect(res.body.message).toEqual('Auction not found')
    })

    it('should respond with Bad Request when bid amount is not present', async () => {
      const res = await request(app)
        .post('/auctions/100/bid')
        .auth(accessToken, { type: 'bearer' })
        .send({})
        .expect(400)
    })

    it('should respond with Forbidden when auction is expired', async () => {
      await Auction.findOneAndUpdate(
        { id: auction.id },
        { status: AuctionStates.EXPIRED }
      )
      const res = await request(app)
        .post(`/auctions/${auction.id}/bid`)
        .auth(accessToken, { type: 'bearer' })
        .send({ bidAmount: 200 })
        .expect(403)

      expect(res.body.message).toEqual('Auction is not active')
    })

    it('should respond with Forbidden when user tries to bid on his own auction', async () => {
      const res = await request(app)
        .post(`/auctions/${auction.id}/bid`)
        .auth(accessToken, { type: 'bearer' })
        .send({ bidAmount: 200 })
        .expect(403)

      expect(res.body.message).toEqual('You cannot bid on your own Auction')
    })

    it('should respond with Forbidden when user is not found', async () => {
      const randomUserId = mongoose.Types.ObjectId()
      const accessTokenCustomUser = generateAccessToken({
        _id: randomUserId.toHexString(),
        role: userSaved.role
      })
      const res = await request(app)
        .post(`/auctions/${auction.id}/bid`)
        .auth(accessTokenCustomUser, { type: 'bearer' })
        .send({ bidAmount: 200 })
        .expect(403)

      expect(res.body.message).toEqual(`There's no such user`)
    })

    it('should respond with Forbidden when bid amount is less than highest bid', async () => {
      const accessTokenCustomUser = generateAccessToken({
        _id: userSavedCustom._id,
        role: userSavedCustom.role
      })
      const bids: AuctionBid[] = [
        { userId: userSavedCustom._id, bidAmount: 200, ignore: false }
      ]
      await Auction.findOneAndUpdate({ id: auction.id }, { bids })

      const res = await request(app)
        .post(`/auctions/${auction.id}/bid`)
        .auth(accessTokenCustomUser, { type: 'bearer' })
        .send({ bidAmount: 150 })
        .expect(403)

      expect(res.body.message).toEqual(
        `Unable to place bid, highest bid is: ${bids[0].bidAmount}`
      )
    })

    it('should respond with forbidden when unable to place bid', async () => {
      const addBidSpy = jest
        .spyOn(Auction.prototype, 'addBid')
        .mockReturnValueOnce(null)
      const accessTokenCustomUser = generateAccessToken({
        _id: userSavedCustom._id,
        role: userSavedCustom.role
      })
      const res = await request(app)
        .post(`/auctions/${auction.id}/bid`)
        .auth(accessTokenCustomUser, { type: 'bearer' })
        .send({ bidAmount: 150 })
        .expect(403)

      expect(res.body.message).toEqual('Unable to place bid')
      expect(addBidSpy).toHaveBeenCalledTimes(1)
    })

    it('should place bid sucessfully', async () => {
      const accessTokenCustomUser = generateAccessToken({
        _id: userSavedCustom._id,
        role: userSavedCustom.role
      })
      const res = await request(app)
        .post(`/auctions/${auction.id}/bid`)
        .auth(accessTokenCustomUser, { type: 'bearer' })
        .send({ bidAmount: 150 })
        .expect(200)

      expect(res.body.id).toEqual(auction.id)
      expect(res.body.bids[0].bidAmount).toEqual(150)
    })
  })

  describe('expireAuction', () => {
    let accessToken: string
    let auction: AuctionResponse
    const userSavedCustom = new User({
      username: 'Username',
      password: '1234567830',
      firstName: 'Test User first name',
      lastName: 'Test User last name',
      usernameOrEmail: 'test3@user.com',
      role: 0,
      googleId: ''
    })

    beforeEach(async () => {
      setupMocks()

      accessToken = generateAccessToken({
        _id: userSaved._id,
        role: userSaved.role
      })
      await userSavedCustom.save()
      auction = await controller.createAuction(
        { user: userSavedCustom } as unknown as express.Request,
        auctionPayload
      )
      await Auction.findOneAndUpdate(
        { id: auction.id },
        { status: AuctionStates.ON_GOING }
      )
    })

    afterEach(async () => {
      await deleteAllAuctions()
    })

    it('should expire an on going auction with no winner', async () => {
      mockedAxios.patch.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{}] }
        })
      )
      mockedAxios.post.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{}] }
        })
      )
      let auctions = await Auction.getOnGoingAuctions()
      let savedAuction = auctions[0]
      savedAuction = await savedAuction.expireAuction()

      expect(savedAuction.status).toEqual(AuctionStates.EXPIRED)
      expect(savedAuction.winnerId).toBe(undefined)

      expect(emitterModules.broadcastExpireAuction).toHaveBeenCalledWith(
        savedAuction.id.toString(),
        {
          status: AuctionStates.EXPIRED
        }
      )
    })

    it('should expire an on going auction with a winner', async () => {
      mockedAxios.patch.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{}] }
        })
      )
      mockedAxios.post.mockImplementation(() =>
        Promise.resolve({
          data: { result: [{}] }
        })
      )
      await controller.addBid(
        { user: userSaved } as unknown as express.Request,
        auction.id,
        { bidAmount: 200, ignore: false }
      )
      await controller.addBid(
        { user: userSaved } as unknown as express.Request,
        auction.id,
        { bidAmount: 205, ignore: false }
      )
      await controller.addBid(
        { user: userSaved } as unknown as express.Request,
        auction.id,
        { bidAmount: 210, ignore: false }
      )

      let auctions = await Auction.getOnGoingAuctions()
      let savedAuction = auctions[0]
      savedAuction = await savedAuction.expireAuction()

      expect(savedAuction.status).toEqual(AuctionStates.EXPIRED)
      expect(savedAuction.winnerId).toEqual(userSaved._id)
      expect(savedAuction.bids.length).toEqual(3)

      expect(emitterModules.broadcastExpireAuction).toHaveBeenCalledWith(
        savedAuction.id.toString(),
        {
          winnerId: {
            name: userSaved.name,
            username: userSaved.username
          },
          status: AuctionStates.EXPIRED
        }
      )
    })
  })

  it('should get all awaiting auctions', async () => {
    const auction = await controller.createAuction(
      { user: userSaved } as unknown as express.Request,
      auctionPayload
    )

    let awaitingAuctions = await Auction.getAwaitingAuctions()

    expect(awaitingAuctions.length).toEqual(1)
  })
})

const deleteAllAuctions = async () => {
  const { collections } = mongoose.connection
  const collection = collections['auctions']
  await collection.deleteMany({})
}

const setupMocks = () => {
  jest.spyOn(emitterModules, 'broadcastExpireAuction').mockReturnValue()
}
