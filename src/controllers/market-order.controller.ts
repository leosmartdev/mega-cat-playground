//TODO: Remove this controller as it is no longer required
const mongoose = require('mongoose')
const db = require('../models')
const MarketOrder = db.marketOrder
const achievement = require('../achievement')

export const create = async (req: any, res: any) => {
  let order = req.body

  order.userId = new mongoose.Types.ObjectId(order.userId)

  const referencedListings = order.listings.map((listing: any) => {
    return new mongoose.Types.ObjectId(listing)
  })
  order.listings = referencedListings

  let dbMarketOrder = new MarketOrder(order)

  try {
    await dbMarketOrder.save()
    await achievement.tradeNFTAchievements(order.userId)
    res.status(200).json({
      message: 'Order successfully created!',
      data: dbMarketOrder
    })
  } catch (error) {
    res.status(400).json({
      error
    })
  }
}

export const index = async (req: any, res: any) => {
  try {
    let orders = await MarketOrder.find()
      .populate('userId') // Hydrate user object.
      .populate('listings')
    res.status(200).json({
      message: 'Market Orders exist!',
      data: orders
    })
  } catch (error) {
    res.status(400).json({
      error
    })
  }
}
