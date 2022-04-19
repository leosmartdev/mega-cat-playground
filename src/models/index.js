const dbConfig = require('../../config/db.config.js')

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const db = {}
db.mongoose = mongoose
db.url = dbConfig.url
db.bkcnStagingUrl = dbConfig.bkcnStagingUrl
db.bkcnProductionUrl = dbConfig.bkcnProductionUrl
db.products = require('./product.model')(mongoose)
db.achivement = require('./achievement.model')(mongoose)
db.collections = require('./collection')(mongoose)
db.users = require('./user.model.js')
db.offer = require('./offer.model')
db.marketOrder = require('./market-order.model') //TODO: Remove this as it is no longer required
db.payout = require('./payout')(mongoose)
db.drop = require('./drop.model')
module.exports = db
