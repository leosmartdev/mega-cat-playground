import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateAccessToken = (data: InfoJWT) =>
  jwt.sign(data, 'mega-cat-secret', {
    expiresIn: '1h'
  })
