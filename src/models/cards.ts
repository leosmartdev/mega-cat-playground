import mongoose, { Document, model, Model } from 'mongoose'

export interface CardPayload {
  /**
   * Card Id
   * @example "1234"
   */
  cardId: string
  /**
   * Card Number
   * @example "1234567890123456"
   */
  cardNumber: string
  /**
   * Card expiry month
   * @example "3"
   */
  expMonth: number
  /**
   * Card expiry year
   * @example "2023"
   */
  expYear: number
  /**
   * Card Holder Name
   * @example "name"
   */
  name: string
  /**
   * Card Holder City
   * @example "some city"
   */
  city: string
  /**
   * Card Holder Country
   * @example "some country"
   */
  country: string
  /**
   * Card Holder Address line 1
   * @example "line 1"
   */
  line1: string
  /**
   * Card Holder Address line 2
   * @example "line 2"
   */
  line2: string
  /**
   * Card Holder district
   * @example "district "
   */
  district: string
  /**
   * Card Holder postal Code
   * @example "some code"
   */
  postalCode: string
}

export interface CardSingle extends CardPayload {
  userId: string
}

export interface CardsResponse {
  data: CardSingle[]
}

export interface SingleCardResponse {
  message: string
  data: CardSingle
}

export interface ICardDocument extends CardSingle, Document {}

const CardSchema = new mongoose.Schema<ICardDocument>(
  {
    cardId: { type: String },
    cardNumber: { type: String },
    expMonth: { type: Number },
    expYear: { type: Number },
    name: { type: String },
    city: { type: String },
    country: { type: String },
    line1: { type: String },
    line2: { type: String },
    district: { type: String },
    postalCode: { type: String },
    userId: { type: String }
  },
  {
    timestamps: true
  }
)

const Card: Model<ICardDocument> = model<ICardDocument>('card', CardSchema)
export default Card
