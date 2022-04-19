import { Express } from 'express'
import request from 'supertest'
import appPromise from '../../app'

import { InfoJWT } from '../../types'
import { generateAccessToken, generateRefreshToken } from '../../utils'

let app: Express
appPromise.then((_app) => {
  app = _app
})

describe('Auth', () => {
  describe('refreshToken', () => {
    let refreshToken: string

    beforeEach(async () => {
      const userInfo: InfoJWT = {
        _id: 'someLongId',
        role: 1
      }
      refreshToken = generateRefreshToken(userInfo)
    })

    it('should respond with new access and refresh tokens', async () => {
      const res = await request(app)
        .post('/auth/refreshToken')
        .auth(refreshToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
    })
  })
})
