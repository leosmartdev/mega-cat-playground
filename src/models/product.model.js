const { isInteger } = require('lodash')

module.exports = (mongoose) => {
  const Product = mongoose.model(
    'product',
    mongoose.Schema(
      {
        name: String,
        description: String,
        contractAddress: { type: String, required: false },
        tokenId: { type: Number, required: false },
        collectionId: String,
        blockchain: String,
        properties: Array,
        image: String,
        price: Number,
        originPrice: Number,
        templateId: Number,
        isListForSell: { type: Boolean, default: false },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
      },
      {
        timestamps: true
      }
    )
  )
  return Product
}
