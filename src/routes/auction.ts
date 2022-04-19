import { Router, Request, Response } from 'express'
import { AuctionController } from '../controllers/auction'
import { auctionBidValidation, auctionValidation } from '../utils/validations'
import { authenticateAccessToken } from '../middlewares'

const auctionRouter = Router()

const controller = new AuctionController()

auctionRouter.get('/', async function (req: Request, res: Response) {
  try {
    const response = await controller.getAllOnGoing()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err)
  }
})

auctionRouter.get(
  '/user',
  authenticateAccessToken,
  async function (req: Request, res: Response) {
    try {
      const response = await controller.getAllCreatedByUser(req)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err)
    }
  }
)

auctionRouter.get(
  '/participated',
  authenticateAccessToken,
  async function (req: Request, res: Response) {
    try {
      const response = await controller.getAllParticipatedByUser(req)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err)
    }
  }
)

auctionRouter.get('/:id', async function (req: Request, res: Response) {
  const { id: auctionId } = req.params

  try {
    const response = await controller.getOne(req, parseInt(auctionId))
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err)
  }
})

auctionRouter.post(
  '/:id/bid',
  authenticateAccessToken,
  async function (req: Request, res: Response) {
    const { id: auctionId } = req.params

    const { error, value: body } = auctionBidValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.addBid(req, parseInt(auctionId), body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err)
    }
  }
)

auctionRouter.post(
  '/:id/disclaim',
  authenticateToken,
  async function (req: Request, res: Response) {
    const { id: auctionId } = req.params

    try {
      const response = await controller.disclaimTopBid(req, parseInt(auctionId))
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err)
    }
  }
)

auctionRouter.post(
  '/',
  authenticateAccessToken,
  async function (req: Request, res: Response) {
    const { error, value: body } = auctionValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.createAuction(req, body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default auctionRouter
