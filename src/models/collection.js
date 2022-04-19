module.exports = (mongoose) => {
  const Collection = mongoose.model(
    'collection',
    mongoose.Schema(
      {
        name: { type: String },
        ownerAddress: { type: String },
        collectionId: { type: String },
        subheading: { type: String },
        about: { type: String },
        royality: { type: String },
        story: { type: String },
        perks: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        lottie: { type: String }
      },
      {
        timestamps: true
      }
    )
  )
  return Collection
}
