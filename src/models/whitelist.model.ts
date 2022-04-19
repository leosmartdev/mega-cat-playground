import mongoose, { Schema, model, Document, Model, Types } from 'mongoose'

const WhitelistSchema = new mongoose.Schema(
  {
    addresses: [{ type: String }],
    drop: { unique: true, type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }
  },
  {
    timestamps: true
  }
)

const Whitelist = mongoose.model('Whitelist', WhitelistSchema)
module.exports = Whitelist
