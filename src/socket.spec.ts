import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import serverSocketPromise, {
  broadcastNewBid,
  ServerToClientEvents
} from './socket'
import emitterSocketPromise, { broadcastExpireAuction } from './socketEmitter'
import { Server as ServerSocket } from 'socket.io'
import Client, { Socket as ClientSocket } from 'socket.io-client'
import { AuctionBidResponse } from './models/auctionBid'
import { AuctionExpireResponse, AuctionStates } from './models/auction'
import { serviceAccountJwt } from './middlewares'
import { loadEnvVariables } from './utils/loadEnvVariables'
import { RedisClientType } from 'redis'

const bid: AuctionBidResponse = {
  userId: {
    name: 'user Full Name',
    username: 'username'
  },
  bidAmount: 12345
}
const auctionId = 'auction1'
const query = {
  auctionId,
  token: serviceAccountJwt
}

const expired: AuctionExpireResponse = {
  winnerId: {
    name: 'user Full Name',
    username: 'username'
  },
  status: AuctionStates.EXPIRED
}

loadEnvVariables()

describe('Socket', () => {
  let httpServer: Server, port: number
  let serverSocket: ServerSocket<ServerToClientEvents>
  let redisPubClient: any
  let redisSubClient: any
  let clientSocket: ClientSocket
  let clientSocketUnauthorized: ClientSocket

  beforeAll((done) => {
    httpServer = createServer()
    serverSocketPromise().then(({ io, pubClient, subClient }) => {
      serverSocket = io
      redisPubClient = pubClient
      redisSubClient = subClient

      serverSocket.attach(httpServer)
      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port
        done()
      })
    })
  })

  afterAll(() => {
    redisPubClient.quit()
    redisSubClient.quit()

    serverSocket.close()
    clientSocket.close()
    httpServer.close()
  })

  test('Unauthorized socket connection', (done) => {
    clientSocketUnauthorized = Client(`http://localhost:${port}`, {
      query: { auctionId }
    })
    clientSocketUnauthorized.on('connect_error', (err) => {
      expect(err.message).toBe('Unauthorized')
      done()
    })
  })

  test('Socket connection with JWT token', (done) => {
    clientSocket = Client(`http://localhost:${port}`, { query })
    clientSocket.on('connect', function () {
      done()
    })
  })
})

describe('Socket - newBid', () => {
  let httpServer: Server, port: number
  let serverSocket: ServerSocket<ServerToClientEvents>
  let redisPubClient: any
  let redisSubClient: any
  let clientSocket: ClientSocket
  let clientSocket1: ClientSocket
  let clientSocket2: ClientSocket
  let clientSocket3: ClientSocket

  beforeAll((done) => {
    httpServer = createServer()
    serverSocketPromise().then(({ io, pubClient, subClient }) => {
      serverSocket = io
      redisPubClient = pubClient
      redisSubClient = subClient

      serverSocket.attach(httpServer)
      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port
        done()
      })
    })
  })

  afterAll(() => {
    redisPubClient.quit()
    redisSubClient.quit()

    serverSocket.close()
    clientSocket.close()
    clientSocket1.close()
    clientSocket2.close()
    clientSocket3.close()
    httpServer.close()
  })

  test('Emit to Single Client', (done) => {
    clientSocket = Client(`http://localhost:${port}`, { query })
    clientSocket.on('connect', function () {
      broadcastNewBid(auctionId, bid)
    })

    clientSocket.on('newBid', (arg) => {
      expect(arg).toMatchObject(bid)
      done()
    })
  })

  test('Emit to multiple Clients', (done) => {
    clientSocket1 = Client(`http://localhost:${port}`, { query })
    clientSocket2 = Client(`http://localhost:${port}`, { query })
    clientSocket3 = Client(`http://localhost:${port}`, { query })

    clientSocket3.on('connect', function () {
      broadcastNewBid(auctionId, bid)
    })

    let count = 0
    clientSocket1.on('newBid', (arg) => {
      expect(arg).toMatchObject(bid)
      if (++count === 3) done()
    })
    clientSocket2.on('newBid', (arg) => {
      expect(arg).toMatchObject(bid)
      if (++count === 3) done()
    })
    clientSocket3.on('newBid', (arg) => {
      expect(arg).toMatchObject(bid)
      if (++count === 3) done()
    })
  })
})

describe('Socket - expireAuction', () => {
  let httpServer: Server, port: number
  let serverSocket: ServerSocket<ServerToClientEvents>
  let redisClient: any
  let redisPubClient: any
  let redisSubClient: any
  let clientSocket: ClientSocket
  let clientSocket1: ClientSocket
  let clientSocket2: ClientSocket
  let clientSocket3: ClientSocket

  beforeAll((done) => {
    httpServer = createServer()
    serverSocketPromise().then(async ({ io, pubClient, subClient }) => {
      serverSocket = io
      redisPubClient = pubClient
      redisSubClient = subClient

      redisClient = (await emitterSocketPromise()).redisClient

      serverSocket.attach(httpServer)
      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port
        done()
      })
    })
  })

  afterAll(async () => {
    await redisClient.quit()
    await redisSubClient.quit()
    await redisPubClient.quit()

    serverSocket.close()
    httpServer.close()
  })

  test('Emit to Single Client', (done) => {
    clientSocket = Client(`http://localhost:${port}`, { query })
    clientSocket.on('connect', function () {
      broadcastExpireAuction(auctionId, expired)
    })

    let count = 0
    clientSocket.on('expireAuction', (arg) => {
      expect(arg).toMatchObject(expired)
      ++count
    })

    clientSocket.on('disconnect', function () {
      if (++count === 2) done()
    })
  })

  test('Emit to Multiple Clients', (done) => {
    clientSocket1 = Client(`http://localhost:${port}`, { query })
    clientSocket2 = Client(`http://localhost:${port}`, { query })
    clientSocket3 = Client(`http://localhost:${port}`, { query })

    let connections = 0
    clientSocket1.on('connect', function () {
      if (++connections === 3) broadcastExpireAuction(auctionId, expired)
    })
    clientSocket2.on('connect', function () {
      if (++connections === 3) broadcastExpireAuction(auctionId, expired)
    })
    clientSocket3.on('connect', function () {
      if (++connections === 3) broadcastExpireAuction(auctionId, expired)
    })

    let count = 0
    clientSocket1.on('expireAuction', (arg) => {
      expect(arg).toMatchObject(expired)
      ++count
    })
    clientSocket2.on('expireAuction', (arg) => {
      expect(arg).toMatchObject(expired)
      ++count
    })
    clientSocket3.on('expireAuction', (arg) => {
      expect(arg).toMatchObject(expired)
      ++count
    })

    clientSocket1.on('disconnect', function () {
      if (++count === 6) done()
    })
    clientSocket2.on('disconnect', function () {
      if (++count === 6) done()
    })
    clientSocket3.on('disconnect', function () {
      if (++count === 6) done()
    })
  })
})
