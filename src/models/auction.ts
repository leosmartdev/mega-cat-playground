import mongoose, { Schema, model, Document, Model, Types } from 'mongoose'
import { broadcastNewBid } from '../socket'
import { broadcastExpireAuction } from '../socketEmitter'
import { cancelOffer, editOffer } from '../utils/venlyUtils'
import { AuctionBid, AuctionBidResponse, bidSchema } from './auctionBid'
import User from './user.model.js'

const db = require('../models')
const achievement = require('../achievement')
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface nftAttribute {
  type: string
  name: string
  value: string
}

interface nftMedia {
  type: string
  value: string
}

interface nftContract {
  chain: string
  address: string
  count: number
  name: string
  description: string
  symbol: string
  url: string
  imageUrl: string
  media: nftMedia[]
  verified: boolean
  premium: boolean
  categories: string[]
}

export interface NftResponse {
  id: string
  address: string
  chain: string
  name: string
  description: string
  imageUrl: string
  imagePreviewUrl: string
  imageThumbnailUrl: string
  animationUrls: string[]
  fungible: boolean
  attributes: nftAttribute[]
  contract: nftContract
  collectionIdentifier: string
}

export interface OfferResponse {
  id: string
  nft: NftResponse
  sellerId: string
  sellerNickname: string
  sellerAddress: string
  startDate: string
  type: string
  status: string
  dataToSign: string
  txInCustody: string
  createdOn: string
  createdBy: string
  modifiedOn: string
  modifiedBy: string
  signed: boolean
  currency: string
  price: number
}

export interface AuctionPayload {
  /**
   * Venly OfferId
   * @example "123456789"
   */
  offerId: string
  /**
   * Expiration timestamp
   * @example "123456789"
   */
  expirationTime: string
  /**
   * Starting Bid, amount in USD
   * @example "123"
   */
  startingBid: number
}

export interface AuctionResponse extends Omit<AuctionPayload, 'offerId'> {
  id: number
  status: string
  ownerId: {
    name: string
    username: string
  }
  winnerId?: {
    name: string
    username: string
  }
  bids: AuctionBidResponse[]
  isClaimed?: boolean
}

export interface OffersForAuction extends OfferResponse {
  auction?: AuctionResponse
}

export interface AuctionOfferResponse {
  message: string
  data: OffersForAuction[]
}

export interface SingleAuctionResponse {
  auction: AuctionResponse
  offer?: {
    id: any
    price: any
    sellerAddress: any
  }
}

export interface AuctionExpireResponse {
  winnerId?: {
    name: string
    username: string
  }
  status: AuctionStates.EXPIRED
}

export enum AuctionStates {
  AWAITING = 'awaiting',
  ON_GOING = 'ongoing',
  EXPIRED = 'expired'
}

export interface IAuctionDocument extends AuctionPayload, Document {
  expirationTime: string
  id: number
  nftId: string
  status: string
  bids: AuctionBid[]
  ownerId: Types.ObjectId
  winnerId: Types.ObjectId
  isClaimed: boolean
}

export interface IAuction extends IAuctionDocument {
  addBid(
    userId: Types.ObjectId,
    bidAmount: number,
    ignore: boolean
  ): Promise<IAuction>
  expireAuction(): Promise<IAuction>
  disclaimTopBid(userId: Types.ObjectId): Promise<IAuction>
}
interface IAuctionModel extends Model<IAuction> {
  getAwaitingAuctions(): Promise<IAuction[]>
  getOnGoingAuctions(filters?: any): Promise<IAuction[]>
  getAllCreatedByUser(ownerId: string): Promise<IAuction[]>
}

const schema = new mongoose.Schema<IAuctionDocument>(
  {
    offerId: { type: String, unique: true, required: true },
    isClaimed: { type: Boolean, default: false },
    expirationTime: { type: Date, required: true },
    startingBid: { type: Number, required: true },
    bids: [{ type: bidSchema }],
    ownerId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    winnerId: { type: Schema.Types.ObjectId, ref: 'user' },
    status: {
      type: String,
      values: AuctionStates,
      default: AuctionStates.AWAITING,
      required: true
    }
  },
  { timestamps: true }
)

schema.plugin(AutoIncrement, { inc_field: 'id' })

const userFieldsToSelect = 'username firstName lastName name -_id'
// Static Methods
schema.static('getAwaitingAuctions', async function () {
  return this.find({ status: AuctionStates.AWAITING })
})
schema.static('getOnGoingAuctions', async function () {
  return await this.find({ status: AuctionStates.ON_GOING }).populate(
    'ownerId',
    userFieldsToSelect
  )
})
schema.static('getAllCreatedByUser', async function (ownerId: string) {
  return await this.find({ ownerId })
    .populate('winnerId', userFieldsToSelect)
    .populate('ownerId', userFieldsToSelect)
})

// Instance Methods
schema.method(
  'addBid',
  async function (userId: Types.ObjectId, bidAmount: number, ignore: boolean) {
    const user = await User.findById(userId)

    if (!user)
      throw {
        code: 403,
        message: `There's no such user`
      }

    const bid: AuctionBid = {
      userId: userId as unknown as string,
      bidAmount,
      ignore
    }

    if (this.bids.length) {
      const highestBid = this.bids.reduce((prev, current) =>
        !prev.ignore && prev.bidAmount > current.bidAmount ? prev : current
      )

      if (bidAmount <= highestBid.bidAmount)
        throw {
          code: 403,
          message: `Unable to place bid, highest bid is: ${highestBid.bidAmount}`
        }
    }

    // Refactor: move to user model, once user model converted to Typescript
    const auctionIndex = user.auctionsParticipatedIn.indexOf(this._id)
    if (auctionIndex === -1) {
      user.auctionsParticipatedIn.push(this._id)
    }
    user.markModified('auctionsParticipatedIn')
    await user.save()

    this.bids.push(bid)

    broadcastNewBid(this.id.toString(), {
      userId: { name: user.name, username: user.username },
      bidAmount
    })
    this.markModified('bids')
    return this.save()
  }
)

// disclaim top bid
schema.method('disclaimTopBid', async function (userId: Types.ObjectId) {
  const user = await User.findById(userId)

  if (!user)
    throw {
      code: 403,
      message: `There's no such user`
    }

  if (this.bids.length) {
    const highestBid = this.bids.reduce((prev, current) =>
      !prev.ignore && prev.bidAmount > current.bidAmount ? prev : current
    )
    const foundIndex = this.bids.findIndex(
      (x) => x.bidAmount === highestBid.bidAmount
    )
    this.bids[foundIndex].ignore = true
    const secondHighestBid = this.bids.reduce((prev, current) =>
      !prev.ignore && prev.bidAmount > current.bidAmount ? prev : current
    )
    await achievement.luckyAchievement(secondHighestBid.userId)
  }

  this.markModified('bids')
  return this.save()
})

/**
 * End Win Auction Achievements Block..
 */
// Instance Methods
schema.method('expireAuction', async function () {
  let winnerId
  if (this.bids.length) {
    const topBid = this.bids.reduce((prev, current) =>
      prev.bidAmount > current.bidAmount ? prev : current
    )
    const highestBid = this.bids.reduce((prev, current) =>
      !prev.ignore && prev.bidAmount > current.bidAmount ? prev : current
    )
    if (topBid.ignore === true) {
      await achievement.luckyAchievement(highestBid.userId)
    }

    this.winnerId = highestBid.userId as unknown as Types.ObjectId
    this.markModified('winnerId')
    await achievement.winAuctionAchievement(
      this.winnerId,
      this.nftId,
      this.bids.length
    )
    await achievement.wellRoundedAchievement(this.winnerId, 'win')

    const winner = await User.findById(this.winnerId)

    winnerId = {
      name: winner.name,
      username: winner.username
    }

    editOffer({
      offerId: this.offerId,
      price: highestBid.bidAmount
    })
  } else {
    cancelOffer({
      offerId: this.offerId
    })
  }

  broadcastExpireAuction(this.id.toString(), {
    winnerId,
    status: AuctionStates.EXPIRED
  })

  this.status = AuctionStates.EXPIRED
  this.markModified('status')
  return this.save()
})

const Auction: IAuctionModel = model<IAuction, IAuctionModel>('Auction', schema)

export default Auction
