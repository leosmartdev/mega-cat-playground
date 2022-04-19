import axios from 'axios'
import express from 'express'
import { Types } from 'mongoose'
import {
  Body,
  Example,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags
} from 'tsoa'
import Auction, {
  AuctionOfferResponse,
  AuctionPayload,
  AuctionResponse,
  AuctionStates,
  IAuction,
  OfferResponse,
  OffersForAuction,
  SingleAuctionResponse
} from '../models/auction'
import { AuctionBidResponse, BidPayload } from '../models/auctionBid'
import User from '../models/user.model.js'
import { getOffer } from '../utils/venlyUtils'
import {
  auctionOfferExample,
  singleAuctionExample
} from './api-examples/example'
const achievement = require('../achievement')
const db = require('../models')

const MEGACAT_STUDIOS_SELLER_ID = 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67'

const userFieldsToSelect = 'username firstName lastName name -_id'

@Route('auctions')
@Tags('Auction')
export class AuctionController {
  /**
   * @summary Get list of all on-going auctions. All users can request this.
   *
   */
  @Example<AuctionOfferResponse>(auctionOfferExample)
  @Get('/')
  public async getAllOnGoing(): Promise<AuctionOfferResponse> {
    const onGoingAuctions: IAuction[] = await Auction.getOnGoingAuctions()
    if (!onGoingAuctions.length)
      return {
        message: 'There are no ongoing auctions.',
        data: []
      }

    const offers: OfferResponse[] = (
      await axios.get(
        `${process.env.MARKET_API_ENDPOINT}/offers?sellerId=${MEGACAT_STUDIOS_SELLER_ID}&status=READY`,
        { headers: { 'Content-Type': 'application/json' } }
      )
    ).data.result

    const offersForAuction: OffersForAuction[] = []
    onGoingAuctions.forEach((auction) => {
      const offer = offers.find((offer) => offer.id === auction.offerId)

      if (!offer) return

      offersForAuction.push({
        ...offer,
        auction: {
          id: auction.id,
          status: auction.status,
          ownerId: {
            name: (auction.ownerId as any)?.name,
            username: (auction.ownerId as any)?.username
          },
          bids: auction.bids as unknown as AuctionBidResponse[],
          expirationTime: auction.expirationTime,
          startingBid: auction.startingBid
        }
      })
    })

    return {
      message: 'Offers was successfully get!',
      data: offersForAuction
    }
  }

  /**
   * @summary Get list of all auctions created by the user.
   *
   */
  @Example<AuctionOfferResponse>(auctionOfferExample)
  @Security('bearerAuth')
  @Get('/user')
  public async getAllCreatedByUser(
    @Request() req: express.Request
  ): Promise<AuctionOfferResponse> {
    const ownerId = req.user._id

    const auctionsByUser: IAuction[] = await Auction.getAllCreatedByUser(
      ownerId
    )
    if (!auctionsByUser.length)
      return {
        message: 'No auction created by user.',
        data: []
      }

    const offers: OfferResponse[] = (
      await axios.get(
        `${process.env.MARKET_API_ENDPOINT}/offers?sellerId=${MEGACAT_STUDIOS_SELLER_ID}&status=SOLD,READY,FINALIZING_OFFER,AWAITING_FINALIZING_OFFER`,
        { headers: { 'Content-Type': 'application/json' } }
      )
    ).data.result

    const offersForAuction: OffersForAuction[] = []
    auctionsByUser.forEach((auction) => {
      const offer = offers.find((offer) => offer.id === auction.offerId)

      if (!offer) return

      const winnerId = auction.winnerId
        ? {
            name: (auction.winnerId as any)?.name,
            username: (auction.winnerId as any)?.username
          }
        : undefined

      offersForAuction.push({
        ...offer,
        auction: {
          id: auction.id,
          isClaimed: auction.isClaimed,
          status: auction.status,
          ownerId: {
            name: (auction.ownerId as any)?.name,
            username: (auction.ownerId as any)?.username
          },
          winnerId,
          bids: auction.bids as unknown as AuctionBidResponse[],
          expirationTime: auction.expirationTime,
          startingBid: auction.startingBid
        }
      })
    })

    return {
      message: 'Offers was successfully get!',
      data: offersForAuction
    }
  }

  /**
   * @summary Get list of all auctions in which user has participated.
   *
   */
  @Example<AuctionOfferResponse>(auctionOfferExample)
  @Security('bearerAuth')
  @Get('/participated')
  public async getAllParticipatedByUser(
    @Request() req: express.Request
  ): Promise<AuctionOfferResponse> {
    const userId = req.user._id

    const userFound = await User.findById({ _id: userId }).populate({
      path: 'auctionsParticipatedIn',
      model: 'Auction',
      populate: {
        path: 'winnerId',
        model: 'user',
        select: userFieldsToSelect
      }
    })
    if (!userFound)
      throw {
        code: 403,
        message: 'User not found'
      }

    const auctionsParticipatedByUser: IAuction[] =
      userFound.auctionsParticipatedIn
    if (!auctionsParticipatedByUser.length)
      return {
        message: 'User has not participated in any auction.',
        data: []
      }

    const offers: OfferResponse[] = (
      await axios.get(
        `${process.env.MARKET_API_ENDPOINT}/offers?sellerId=${MEGACAT_STUDIOS_SELLER_ID}&status=SOLD,READY,FINALIZING_OFFER,AWAITING_FINALIZING_OFFER`,
        { headers: { 'Content-Type': 'application/json' } }
      )
    ).data.result

    const offersForAuction: OffersForAuction[] = []
    auctionsParticipatedByUser.forEach((auction) => {
      const offer = offers.find((offer) => offer.id === auction.offerId)

      if (!offer) return

      const winnerId = auction.winnerId
        ? {
            name: (auction.winnerId as any)?.name,
            username: (auction.winnerId as any)?.username
          }
        : undefined

      offersForAuction.push({
        ...offer,
        auction: {
          id: auction.id,
          isClaimed: auction.isClaimed,
          status: auction.status,
          ownerId: {
            name: (auction.ownerId as any)?.name,
            username: (auction.ownerId as any)?.username
          },
          winnerId,
          bids: auction.bids as unknown as AuctionBidResponse[],
          expirationTime: auction.expirationTime,
          startingBid: auction.startingBid
        }
      })
    })

    return {
      message: 'Offers was successfully get!',
      data: offersForAuction
    }
  }

  /**
   * @summary Get a single Auction
   * @param id The auction identifier
   * @example auctionId 1234
   */
  @Example<SingleAuctionResponse>(singleAuctionExample)
  @Get('{id}')
  public async getOne(
    @Request() req: express.Request,
    @Path() id: number
  ): Promise<SingleAuctionResponse> {
    const auction = await Auction.findOne(
      { id },
      'id expirationTime startingBid status ownerId offerId bids isClaimed -_id'
    )
      .populate('ownerId')
      .populate('winnerId')
      .populate('bids.userId', userFieldsToSelect)

    if (!auction)
      throw {
        code: 403,
        message: 'Auction not found'
      }

    const offerDetails = await getOffer(auction.offerId)
    const offer =
      offerDetails?.result?.status === 'READY'
        ? {
            id: offerDetails.result.id,
            price: offerDetails.result.price,
            sellerAddress: offerDetails.result.sellerAddress
          }
        : undefined

    const winnerId = auction.winnerId
      ? {
          name: (auction.winnerId as any)?.name,
          username: (auction.winnerId as any)?.username
        }
      : undefined

    return {
      auction: {
        id: auction.id,
        isClaimed: auction.isClaimed,
        status: auction.status,
        ownerId: {
          name: (auction.ownerId as any)?.name,
          username: (auction.ownerId as any)?.username
        },
        winnerId,
        bids: auction.bids as unknown as AuctionBidResponse[],
        expirationTime: auction.expirationTime,
        startingBid: auction.startingBid
      },
      offer
    }
  }

  /**
   * @summary Create a bid on an ongoing auction with the following attributes: userId and bidAmount. All users can request this.
   * @param auctionId The auction identifier
   * @example auctionId 1234
   */
  @Example<AuctionResponse>({
    status: 'ongoing',
    expirationTime: '2022-02-28T07:59:00.000Z',
    startingBid: 50,
    ownerId: {
      name: 'John Snow',
      username: 'johnsnow01'
    },
    bids: [
      {
        userId: {
          name: 'Steve Jobs',
          username: 'stevejobs01'
        },
        bidAmount: 100
      }
    ],
    id: 32
  })
  @Security('bearerAuth')
  @Post('{auctionId}/disclaim')
  public async disclaimTopBid(
    @Request() req: express.Request,
    @Path() auctionId: number
  ): Promise<AuctionResponse> {
    const userId = req.user._id as unknown as Types.ObjectId

    const auction = await Auction.findOne({ id: auctionId })
      .populate('ownerId')
      .populate('bids.userId')

    if (!auction)
      throw {
        code: 403,
        message: 'Auction not found'
      }

    if (auction.status !== AuctionStates.ON_GOING)
      throw {
        code: 403,
        message: 'Auction is not active'
      }

    if ((auction.ownerId as any)._id.equals(userId))
      throw {
        code: 403,
        message: 'You cannot bid on your own Auction'
      }

    const updatedAuction = await auction.disclaimTopBid(userId)

    if (!updatedAuction)
      throw {
        code: 403,
        message: `Unable to disclaim bid`
      }

    const response: AuctionResponse = {
      id: updatedAuction.id,
      status: updatedAuction.status,
      ownerId: {
        name: (updatedAuction.ownerId as any).name,
        username: (updatedAuction.ownerId as any).username
      },
      bids: updatedAuction.bids as unknown as AuctionBidResponse[],
      expirationTime: updatedAuction.expirationTime,
      startingBid: updatedAuction.startingBid
    }

    return response
  }

  /**
   * @summary Create a bid on an ongoing auction with the following attributes: userId and bidAmount. All users can request this.
   * @param auctionId The auction identifier
   * @example auctionId 1234
   */
  @Example<AuctionResponse>({
    status: 'ongoing',
    expirationTime: '2022-02-28T07:59:00.000Z',
    startingBid: 50,
    ownerId: {
      name: 'John Snow',
      username: 'johnsnow01'
    },
    bids: [
      {
        userId: {
          name: 'Steve Jobs',
          username: 'stevejobs01'
        },
        bidAmount: 100
      }
    ],
    id: 32
  })
  @Security('bearerAuth')
  @Post('{auctionId}/bid')
  public async addBid(
    @Request() req: express.Request,
    @Path() auctionId: number,
    @Body() data: BidPayload
  ): Promise<AuctionResponse> {
    const userId = req.user._id as unknown as Types.ObjectId
    const { bidAmount, ignore } = data

    const auction = await Auction.findOne({ id: auctionId })
      .populate('ownerId')
      .populate('bids.userId', userFieldsToSelect)

    if (!auction)
      throw {
        code: 403,
        message: 'Auction not found'
      }

    if (auction.status !== AuctionStates.ON_GOING)
      throw {
        code: 403,
        message: 'Auction is not active'
      }

    if ((auction.ownerId as any)._id.equals(userId))
      throw {
        code: 403,
        message: 'You cannot bid on your own Auction'
      }

    const updatedAuction = await auction.addBid(userId, bidAmount, ignore)

    if (!updatedAuction)
      throw {
        code: 403,
        message: `Unable to place bid`
      }

    const response: AuctionResponse = {
      id: updatedAuction.id,
      status: updatedAuction.status,
      ownerId: {
        name: (updatedAuction.ownerId as any).name,
        username: (updatedAuction.ownerId as any).username
      },
      bids: updatedAuction.bids as unknown as AuctionBidResponse[],
      expirationTime: updatedAuction.expirationTime,
      startingBid: updatedAuction.startingBid
    }

    return response
  }

  /**
   * END Create Auction Achievement...
   *  */
  /**
   * @summary Create auction with the following attributes: UserId, UserName, Password, isAdmin, isActive. All users can request this.
   *
   */
  @Example<AuctionResponse>({
    id: 1234,
    expirationTime: 'expirationTimeSTring',
    startingBid: 123,
    status: AuctionStates.AWAITING,
    ownerId: {
      name: 'John Snow',
      username: 'johnSnow01'
    },
    bids: []
  })
  @Security('bearerAuth')
  @Post('/')
  public async createAuction(
    @Request() req: express.Request,
    @Body() body: AuctionPayload
  ): Promise<AuctionResponse> {
    const ownerId = req.user._id
    const { offerId, expirationTime, startingBid } = body

    // const offer = await getOffer(offerId)
    // if (offer?.result?.status !== 'INITIATING_OFFER')
    //   throw new Error(`Invalid offerId: ${offerId}`)

    const alreadyExist = await Auction.findOne({ offerId })
    if (alreadyExist)
      throw new Error(`Auction already exists with offerId: ${offerId}`)

    const userFound = await User.findById({ _id: ownerId })
    if (!userFound) throw new Error('User not found')

    // do additional check, this offerId should be in AWAITING STATE in venly.

    const newAuction = new Auction({
      offerId,
      expirationTime,
      startingBid,
      ownerId
    })

    await newAuction.save()

    /**
     * Create Auction Achievement...
     *  */
    const response = await achievement.firstAuctionAchievement(ownerId, offerId)
    await achievement.wellRoundedAchievement(ownerId, 'list')
    /**
     * END Create Auction Achievement...
     *  */
    const expirationTimeString = JSON.parse(
      JSON.stringify(newAuction.expirationTime)
    )
    return {
      id: newAuction.id,
      expirationTime: expirationTimeString,
      startingBid: newAuction.startingBid,
      status: newAuction.status,
      ownerId: {
        name: userFound.name,
        username: userFound.username
      },
      bids: []
    }
  }
}
