import { InfoJWT } from '../../'

declare global {
  namespace Express {
    interface Request {
      user: InfoJWT
    }
  }
}
