import { Router } from 'express'
import * as Auth from '../controllers/auth.controller'
import { authenticateRefreshToken } from '../middlewares'

const authRouter = Router()

authRouter.post('/login', Auth.login)
authRouter.post('/loginUserFirebase', Auth.loginUserFirebase)
authRouter.post('/createUserFirebase', Auth.createUserFirebase)
authRouter.post('/loginWithJwt', Auth.loginWithJwt)
authRouter.post('/lookupEmail', Auth.lookupEmail)
authRouter.post('/refreshToken', authenticateRefreshToken, Auth.refreshToken)

export default authRouter
