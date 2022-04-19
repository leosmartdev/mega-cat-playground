import { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

export const serviceAccountJwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjE4OTcwYjY3MDNkNzY2ZDFlNzMyNTg0IiwibmFtZSI6IlN0ZXZlIExpdmluZ3N0b24iLCJhdXRob3JpdHkiOiJ0aGlzIGlzIGEgdGVzdCBqd3QgZm9yIHN0YWdpbmciLCJpYXQiOjE1MTYyMzkwMjJ9.-vsMT_OMzcOrpXXeHaOQgH7HZuX4nG7XJr6PhG2NZzk'

export const authenticateAccessToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1] ?? ''

  try {
    validateTokenAndAppendToRequestBody(next, token, req)
  } catch (e) {
    res.sendStatus(e as number)
  }
}

export const authenticateRefreshToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1] ?? ''

  try {
    validateTokenAndAppendToRequestBody(next, token, req, 'refreshToken')
  } catch (e) {
    res.sendStatus(e as number)
  }
}

export const validateTokenAndAppendToRequestBody = (
  next: any,
  token?: string,
  req?: any,
  tokenType: 'accessToken' | 'refreshToken' = 'accessToken'
) => {
  if (!token) throw 401

  const key =
    tokenType === 'accessToken'
      ? 'mega-cat-secret'
      : 'mega-cat-secret-for-refresh-token'

  jwt.verify(token, key, (err: any, data: any) => {
    // added for testing purposes, should be removed after testing
    if (token == serviceAccountJwt) {
      if (req) req.user = data
      return next()
    }

    if (err) {
      throw 401
    } else if (data) {
      if (req) req.user = data
      next()
    } else {
      throw 401
    }
  })
}
