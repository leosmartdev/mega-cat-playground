const mongoose = require('mongoose')

const MediaSchema = new mongoose.Schema({
  type: { type: String },
  value: { type: String }
})

const ContractSchema = new mongoose.Schema({
  address: { type: String },
  chain: { type: String },
  name: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  url: { type: String },
  media: [MediaSchema],
  verified: { type: Boolean },
  count: { type: Number },
  symbol: { type: String }
})

const Contract = mongoose.model('COntract', ContractSchema)
module.exports = Contract
