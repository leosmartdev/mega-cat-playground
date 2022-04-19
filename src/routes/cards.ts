import { Router, Request, Response } from 'express'
import { CardsController } from '../controllers/cards'
import { cardsValidation } from '../utils/validations'

const cardsRouter = Router()
const controller = new CardsController()

cardsRouter.post('/create', async function (req: Request, res: Response) {
  const { error, value: body } = cardsValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.create(req, body)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err)
  }
})

cardsRouter.get('/index', async function (req: Request, res: Response) {
  try {
    const response = await controller.index(req)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err)
  }
})

export default cardsRouter
