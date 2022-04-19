import { Socket } from 'socket.io'
import { validateTokenAndAppendToRequestBody } from '.'

export const authenticateTokenSocket = (socket: Socket, next: Function) => {
  const token = socket.handshake.query.token as string

  try {
    validateTokenAndAppendToRequestBody(next, token)
  } catch (e) {
    next(new Error('Unauthorized'))
  }
}
