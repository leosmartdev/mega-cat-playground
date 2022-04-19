import { Router, Request, Response } from 'express'
import { OrderController } from '../controllers/order'
import { orderValidation } from '../utils/validations'
import {
  authenticateAccessToken,
  filterOffersbeforeProceeding
} from '../middlewares'

const orderRouter = Router()

const controller = new OrderController()

orderRouter.get('/index', async function (req: Request, res: Response) {
  try {
    const response = await controller.getOrders()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err)
  }
})

orderRouter.post(
  '/create',
  authenticateAccessToken,
  filterOffersbeforeProceeding,
  async function (req: Request, res: Response) {
    const { error, value: body } = orderValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.create(req, body)
      res.json(response)
    } catch (err: any) {
      res.status(403).send(err)
    }
  }
)

export default orderRouter
