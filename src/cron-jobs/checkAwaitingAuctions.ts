import cron from 'node-cron'
import Auction, { AuctionStates } from '../models/auction'
import { broadcastExpireAuction } from '../socketEmitter'
const { getOffer } = require('../utils/venlyUtils')

export const checkAwaitingAuctions = cron.schedule(
  '* * * * *',
  async () => {
    console.log('checking checkAwaitingAuctions')

    const auctions: { id: number; offerId: string }[] =
      await Auction.getAwaitingAuctions()

    auctions.forEach(({ id, offerId }) => {
      checkAndUpdateStatus(id, offerId)
    })
  },
  { scheduled: false }
)

const checkAndUpdateStatus = async (auctionId: number, offerId: string) => {
  const offer = await getOffer(offerId)
  const status: string = offer?.result?.status ?? ''

  switch (status) {
    case 'NEW':
    case 'INITIATING_OFFER':
      // Do nothing, wait for offer to be in READY state
      break

    case 'READY':
      console.log(
        `Updating Auction Status of '${auctionId}' to '${AuctionStates.ON_GOING}'`
      )

      await Auction.findOneAndUpdate(
        { id: auctionId },
        { status: AuctionStates.ON_GOING }
      )
      break

    case 'FINALIZING_OFFER':
    case 'CLOSING_OFFER':
      console.error(
        "Weird behavior, not possible for an awaiting auction's offer to be in such state",
        auctionId,
        status
      )
      break

    case 'SOLD':
    case 'CLOSED':
    case 'REFUSED':
    case 'ERROR':
      // In such cases, update auction to be expired
      await Auction.findOneAndUpdate(
        { id: auctionId },
        { status: AuctionStates.EXPIRED }
      )
      broadcastExpireAuction(auctionId.toString(), {
        status: AuctionStates.EXPIRED
      })
      break
  }
}
