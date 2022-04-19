import express from 'express'
import { Body, Example, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import Card, {
  CardPayload,
  CardSingle,
  CardsResponse,
  SingleCardResponse
} from '../models/cards'
import { cardExample, cardsExamle } from './api-examples/example'

@Route('cards')
@Tags('Card')
export class CardsController {
  /**
   * @summary Create card with the provided items
   *
   */
  @Example<SingleCardResponse>(cardExample)
  @Security('bearerAuth')
  @Post('/create')
  public async create(
    @Request() req: express.Request,
    @Body() body: CardPayload
  ): Promise<SingleCardResponse> {
    const card = await Card.find({
      $and: [{ cardId: body.cardId }, { userId: req.user._id }]
    })
    if (card.length === 0) {
      const card = new Card({
        cardId: body.cardId,
        cardNumber: body.cardNumber,
        expMonth: body.expMonth,
        expYear: body.expYear,
        name: body.name,
        city: body.city,
        country: body.country,
        line1: body.line1,
        line2: body.line2,
        district: body.district,
        postalCode: body.postalCode,
        userId: req.user._id
      })

      await card.save()

      return {
        message: 'Card saved successfully!',
        data: {
          cardId: card.cardId,
          cardNumber: card.cardNumber,
          expMonth: card.expMonth,
          expYear: card.expYear,
          name: card.name,
          city: card.city,
          country: card.country,
          line1: card.line1,
          line2: card.line2,
          district: card.district,
          postalCode: card.postalCode,
          userId: card.userId
        }
      }
    }
    return {
      message: 'Card Already Exists!',
      data: {
        cardId: body.cardId,
        cardNumber: body.cardNumber,
        expMonth: body.expMonth,
        expYear: body.expYear,
        name: body.name,
        city: body.city,
        country: body.country,
        line1: body.line1,
        line2: body.line2,
        district: body.district,
        postalCode: body.postalCode,
        userId: req.user._id
      }
    }
  }

  /**
   * @summary Get all the cards created by the user
   *
   */
  @Example<CardsResponse>(cardsExamle)
  @Security('bearerAuth')
  @Get('/index')
  public async index(@Request() req: express.Request): Promise<CardsResponse> {
    const cards = await Card.find({ userId: req.user._id })

    cards.map((card) => {
      return {
        cardId: card.cardId,
        cardNumber: card.cardNumber,
        expMonth: card.expMonth,
        expYear: card.expYear,
        userId: card.userId
      }
    })

    return {
      data: cards
    }
  }
}
