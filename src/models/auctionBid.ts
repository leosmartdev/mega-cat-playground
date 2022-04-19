import { Schema, Document, Types } from 'mongoose'

export interface BidPayload {
  /**
   * Bid Amount
   * @example "100"
   */
  bidAmount: number
  ignore: boolean
}

export interface AuctionBidResponse {
  userId: {
    name: string
    username: string
  }
  bidAmount: number
}

export interface AuctionBid {
  userId: string
  bidAmount: number
  ignore: boolean
}

interface IAuctionBidDocument extends AuctionBid, Document {}
export const bidSchema = new Schema<IAuctionBidDocument>(
  { userId: { type: Schema.Types.ObjectId, ref: 'user' }, bidAmount: Number },
  { timestamps: true }
)
