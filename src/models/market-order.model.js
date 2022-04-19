//TODO: Remove this model as it is no longer required
const mongoose = require('mongoose')

// TODO: Refactor Frag's 'order' name since it doesn't actually
// TODO: represent an order, it represents an offer (ie: listing)
const MarketOrderSchema = new mongoose.Schema(
  {
    id: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    buyerAddress: { type: String },
    listings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'order' }]
  },
  {
    timestamps: true
  }
)

const MarketOrder = mongoose.model('MarketOrder', MarketOrderSchema)
module.exports = MarketOrder
