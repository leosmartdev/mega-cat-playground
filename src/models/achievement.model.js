const mongoose = require('mongoose')

const AchievementSchema = new mongoose.Schema(
  {
    image: { type: String },
    nftname: { type: String },
    achievementId: { type: String, required: true },
    actionTaken: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    point: { type: Number, default: 0, required: true },
    nftid: { type: String },
    offerId: { type: String },
    userid: { type: String, required: true },
    percentage: { type: Number, default: 0, required: true },
    status: { type: Boolean, required: true, default: false },
    state: {
      type: String,
      required: true,
      enum: ['Inprogress', 'Unlocked', 'Locked'],
      default: 'Inprogress'
    }
  },
  {
    timestamps: true
  }
)

module.exports = (mongoose) => {
  const Achievement = mongoose.model('achievement', AchievementSchema)

  return Achievement
}

// const AchievementSchema = new mongoose.Schema({
//   image: { type: String, required: true },
//   point: { type: Number, default: 0, required: true },
//   nftid: { type: String, required: true },
//   status: { type: Boolean, required: true, default: false },
//   state: {
//     type: String,
//     required: true,
//     enum: ['Inprogress', 'Unlocked', 'Locked'],
//     default: 'Inprogress'
//   }
// })

// const Achievement = mongoose.model('achievement', AchievementSchema)
// module.exports = Achievement
