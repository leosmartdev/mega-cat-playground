import { createClient } from 'redis'
import { Emitter } from '@socket.io/redis-emitter'

import { AuctionExpireResponse } from './models/auction'

export interface ServerToClientEvents {
  expireAuction: (expired: AuctionExpireResponse) => void
}

let emitter: Emitter<ServerToClientEvents>

export const broadcastExpireAuction = (
  auctionId: string,
  expired: AuctionExpireResponse
) => {
  emitter.to(auctionId).emit('expireAuction', expired)

  emitter.in(auctionId).disconnectSockets()
}

export default async () => {
  const redisClient = createClient({
    url: process.env.REDIS_URL
  })

  await redisClient.connect()
  console.log('Connected to Redis')

  emitter = new Emitter<ServerToClientEvents>(redisClient)
  return { emitter, redisClient }
}
