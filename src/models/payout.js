module.exports = (mongoose) => {
  const Payout = mongoose.model(
    'payout',
    mongoose.Schema(
      {
        nftId: { type: String },
        sellerAddress: { type: String },
        sellerCircleWalletID: { type: String },
        nftPrice: { type: Number },
        platformFee: { type: Number },
        payoutAmount: { type: Number },
        nftName: { type: String },
        nftImage: { type: String },
        status: {
          type: String,
          values: ['pending', 'cleared'],
          default: 'pending'
        },
        offerId: {
          type: String
        },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'order' }
      },
      {
        timestamps: true
      }
    )
  )
  return Payout
}
