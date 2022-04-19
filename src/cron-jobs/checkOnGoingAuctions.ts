import cron from 'node-cron'
import Auction, { IAuction } from '../models/auction'

export const checkOnGoingAuctions = cron.schedule(
  '* * * * *',
  async () => {
    console.log('checking checkOnGoingAuctions')

    const auctions = await Auction.getOnGoingAuctions()

    auctions.forEach(checkAndUpdateStatus)
  },
  { scheduled: false }
)

const checkAndUpdateStatus = async (auction: IAuction) => {
  const currentTime = getCurrentDateTime()

  if (compareDates(currentTime, auction.expirationTime)) {
    // const offer = await getOffer(offerId)
    // if (offer?.result?.status === 'READY') {
    console.log(`Expiring Auction '${auction.id}'`)

    auction.expireAuction()

    // }
  }
}

const getCurrentDateTime = () => {
  const tzOffSet = new Date().getTimezoneOffset() * 60000 //offset in milliseconds
  const localISOTime = new Date(Date.now() - tzOffSet)
    .toISOString()
    .slice(0, 16)
  return localISOTime
}

const compareDates = (currentDate: string, dueDate: string) => {
  const currentDateTime = new Date(currentDate).getTime()
  const dueDateTime = new Date(dueDate).getTime()

  return currentDateTime >= dueDateTime
}
