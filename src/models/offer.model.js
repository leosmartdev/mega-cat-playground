const mongoose = require('mongoose')
const Nft = require('./nft.model')

const OfferSchema = new mongoose.Schema(
  {
    id: { type: String },
    nft: Nft.schema,
    sellerId: { type: String },
    sellerAddress: { type: String },
    startDate: { type: String },
    type: { type: String },
    status: { type: String },
    dataToSign: { type: String },
    createdOn: { type: String },
    createdBy: { type: String },
    price: { type: Number }
  },
  {
    timestamps: true
  }
)

OfferSchema.index({
  sellerAddress: 'text',
  sellerId: 'text'
})

const Offer = mongoose.model('Offer', OfferSchema)
module.exports = Offer
