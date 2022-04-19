import { Server } from 'socket.io'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'

import { authenticateTokenSocket } from './middlewares'
import { AuctionExpireResponse } from './models/auction'
import { AuctionBidResponse } from './models/auctionBid'

import db from './models'
const mongoose = require('mongoose')
const User = db.users

export interface ServerToClientEvents {
  newBid: (bid: AuctionBidResponse) => void
  expireAuction: (expired: AuctionExpireResponse) => void
  newAchievement: (achievement: any) => void
}

const io = new Server<ServerToClientEvents>()

io.use(authenticateTokenSocket)

io.on('connection', (socket) => {
  const { auctionId } = socket.handshake.query
  // TODO:
  // if there's an onGoing Auction, then join that room
  // else don't connect
  if (auctionId) socket.join(auctionId)
})

export const broadcastNewBid = (auctionId: string, bid: AuctionBidResponse) => {
  io.to(auctionId).emit('newBid', bid)
}

io.of('/achievement').on('connection', async (socket) => {
  let { userId } = socket.handshake.query
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    socket.join(userId)
  }
})

export const broadcastNewAchieve = (userId: string, achievement: any) => {
  console.log(userId, achievement)
  io.of('/achievement').to(userId).emit('newAchievement', achievement)
}

export default async () => {
  const pubClient = createClient({ url: process.env.REDIS_URL })
  const subClient = pubClient.duplicate()

  await pubClient.connect()
  await subClient.connect()

  console.log('Connected to Redis')

  io.adapter(createAdapter(pubClient, subClient))

  return { io, pubClient, subClient }
}
