const mongoose = require('mongoose')
const Contract = require('./contract.model')

const AttributeSchema = new mongoose.Schema({
  traitType: { type: String },
  value: { type: String },
  traitCount: { type: String },
  displayType: { type: String }
})

const NftSchema = new mongoose.Schema({
  id: { type: String },
  tokenId: { type: String },
  address: { type: String },
  chain: { type: String },
  name: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  url: { type: String },
  imagePreviewUrl: { type: String },
  imageThumbnailUrl: { type: String },
  attributes: [AttributeSchema],
  contract: Contract.schema,
  collectionIdentifier: { type: String }
})

const Nft = mongoose.model('Nft', NftSchema)
module.exports = Nft
