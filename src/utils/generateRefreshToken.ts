import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateRefreshToken = (data: InfoJWT) =>
  jwt.sign(data, 'mega-cat-secret-for-refresh-token', {
    expiresIn: '1d'
  })
