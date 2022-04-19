const mongoose = require('mongoose')

const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      index: { unique: true }
    },
    firstName: String,
    lastName: String,
    name: String,
    bio: String,
    usernameOrEmail: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: String,
    //0 user
    //1 admin
    // 2 superadmin
    role: { type: Number, required: true },
    avatar: String,
    banner: String,
    circleWalletId: String,
    auctionsParticipatedIn: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }
    ],
    isListForSell: { type: Boolean, default: false },
    walletAddresses: [{ type: String }],
    createdAt: { type: Date, default: new Date('2022-3-29') },
    lastLoggedIn: { type: Date },
    countConsecutiveDays: { type: Number, default: 0 },
    countConsecutiveWeeks: { type: Number, default: 0 },
    sellCount: { type: Number, default: 0 },
    linkedWalletAddresses: [{ type: String }]
  },
  {
    timestamps: true
  }
)

const User = mongoose.model('user', UserSchema)
module.exports = User
