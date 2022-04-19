import { RequestHandler } from 'express'
import Auction from '../models/auction'

export const filterOffersbeforeProceeding: RequestHandler = async (
  req,
  res,
  next: any
) => {
  const items = JSON.parse(req.body.items)

  const auctions = await Auction.find({})
  const offerIdsAsAuction = auctions.map((auction) => auction.offerId)

  const itemsEligibleToBuy = items.filter((item: any) => {
    if (offerIdsAsAuction.includes(item._id)) {
      const relevantAuction = auctions.find((a) => a.offerId === item._id)

      return relevantAuction?.winnerId.toString() === req.user._id
    }
    return true
  })

  req.body.items = JSON.stringify(itemsEligibleToBuy)

  next()
}
