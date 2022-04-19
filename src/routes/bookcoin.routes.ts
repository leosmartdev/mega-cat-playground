import express, { Request, Response } from 'express'
import { UploadedFile } from 'express-fileupload'

import { BookcoinController } from '../controllers/bookcoin'
import { authenticateAccessToken } from '../middlewares'
import { teamValidation } from '../utils/validations'

const bookCoinRouter = express.Router()
const bookCoinController = new BookcoinController()

bookCoinRouter.post(
  '/create',
  authenticateAccessToken,
  async function (req: Request, res: Response) {
    const { error: errBody, value: body } = teamValidation(req.body)
    if (errBody) return res.status(400).send(errBody.details[0].message)

    if (!req.files?.image)
      return res.status(400).send('"image" is not present.')

    try {
      const response = await bookCoinController.createTeam(
        req.files.image as UploadedFile,
        body.title,
        body.description
      )
      res.json(response)
    } catch (err: any) {
      res.status(403).send(err)
    }
  }
)
bookCoinRouter.get('/index', async function (req: Request, res: Response) {
  try {
    const response = await bookCoinController.findTeam()
    res.send(response)
  } catch (err: any) {
    res.status(400).send(err)
  }
})

export default bookCoinRouter
