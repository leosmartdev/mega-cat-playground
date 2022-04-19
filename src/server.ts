import { createServer } from 'http'

import appPromise from './app'
import socketPromise from './socket'

appPromise.then(async (app) => {
  const httpServer = createServer(app)

  const { io: socket } = await socketPromise()

  socket.attach(httpServer)

  const PORT = process.env.PORT || 8080
  httpServer.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
  })
})
