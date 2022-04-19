import mongoose, { Schema, model, Document, Model, Types } from 'mongoose'

const PaymentSchema = new mongoose.Schema({
  txHash: String,
  price: Number
})

const MintItemSchema = new mongoose.Schema({
  tokenId: { type: String },
  mintedOn: { type: Date },
  recipient: { type: String },
  txHash: { type: String },
  confirmed: { type: Boolean },
  success: { type: Boolean },
  quantity: { type: Number },
  payment: { type: PaymentSchema }
})

const SectionSchema = new mongoose.Schema({
  title: String,
  markdown: String
})

const DropSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String },
    title: { type: String }, // for BookCoin only. Deprecated. Remove once BookCoin devs confirm switch.
    description: { type: String },
    image: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    standardTokens: { type: Number },
    premiumTokens: { type: Number },
    premiumTokenIds: [{ type: String }],
    reservationNumber: { type: Number },
    smartContractAddress: { type: String },
    chain: { type: String },
    price: { type: Number },
    currency: { type: String },
    sections: [{ type: SectionSchema }],
    mints: [{ type: MintItemSchema }],

    paymentOwner: { type: String, required: true },
    whitelist: { type: String },
    whitelistUrl: { type: String },

    launchDateTime: { type: String, required: true },
    launchDateMillis: { type: Date, required: true }, // Not used by frontend.
    publicDateTime: { type: String, required: true },
    publicDateMillis: { type: Date, required: true } // Not used by frontend.
  },
  {
    timestamps: true
  }
)

const Drop = mongoose.model('Drop', DropSchema)
module.exports = Drop
