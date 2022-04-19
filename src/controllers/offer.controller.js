const db = require('../models')
const Offer = db.offer

async function create(req, res) {
  let offer = req.body
  let dbOffer = new Offer(offer)

  try {
    await dbOffer.save()
    res.status(200).json({
      message: 'Offer successfully created!',
      data: dbOffer
    })
  } catch (error) {
    res.status(400).json({
      error
    })
  }
}

async function index(req, res) {
  try {
    let offers = await Offer.find()
    res.status(200).json({
      message: 'Offers exist!',
      data: offers
    })
  } catch (error) {
    res.status(400).json({
      error
    })
  }
}

module.exports = {
  create,
  index
}
