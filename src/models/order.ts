import mongoose, { Document, Model, model } from 'mongoose'
import { OfferResponse } from './auction'

export interface CartItem {
  _id: string
  name: string
  tokenId: string
  collection?: string
  image: string
  price: number
  count: number
  subTotal: number
  sellerAddress: string
}

export interface OrderPayload {
  total: string
  items: string
  walletAddress: string
  userName: string
}

export interface OrderSingle {
  sellerAddress: string
  buyerAddress: string
  nftId: string
  nftName: string
  nftImage: string
  tokenId: string
  nftPrice: number
}

export interface IOrderDocument extends OrderSingle, Document {}

export interface OrdersResponse {
  message: string
  data: OrderSingle[]
}

export interface Offer {
  success: boolean
  result: OfferResponse
}

export interface OrderResponse {
  message: string
  data: Offer[]
}

const orderSchema = new mongoose.Schema(
  {
    sellerAddress: { type: String },
    buyerAddress: { type: String },
    nftId: { type: String },
    nftName: { type: String },
    nftImage: { type: String },
    tokenId: { type: String },
    nftPrice: { type: Number }
  },
  {
    timestamps: true
  }
)

const Order: Model<IOrderDocument> = model<IOrderDocument>('order', orderSchema)

export default Order
