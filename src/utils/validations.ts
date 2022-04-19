import Joi from 'joi'

export const auctionValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    offerId: Joi.string().required(),
    expirationTime: Joi.date()
      .timestamp()
      .raw()
      .required()
      .greater(Date.now() + 60 * 60 * 1000) // greater than 1 hour
      .less(Date.now() + 30 * 24 * 60 * 60 * 1000) // less than 30 days
      .messages({
        'date.greater': `"expirationTime" must be atleast 1 hour`,
        'date.less': `"expirationTime" must not exceed 30 days`
      }),
    startingBid: Joi.number().required()
  }).validate(data)

export const auctionBidValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    bidAmount: Joi.number().required()
  }).validate(data)

export const teamValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    title: Joi.string().required(),
    description: Joi.string()
  }).validate(data)

export const orderValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    total: Joi.string().required(),
    items: Joi.string().required(),
    walletAddress: Joi.string().alphanum().required(),
    userName: Joi.string().required()
  }).validate(data)

export const cardsValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    cardId: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    line1: Joi.string().required(),
    line2: Joi.string(),
    name: Joi.string().required(),
    district: Joi.string().required(),
    postalCode: Joi.string().required(),
    cardNumber: Joi.string()
      .length(16)
      .pattern(/^[0-9]+$/, 'numbers')
      .message('Invalid Card Number'),
    expYear: Joi.number()
      .required()
      .min(new Date().getFullYear())
      .message('Card has expired!'),
    expMonth: Joi.number()
      .when('expYear', {
        is: new Date().getFullYear(),
        then: Joi.number()
          .required()
          .min(new Date().getMonth() + 1)
          .max(12)
          .messages({
            'number.min': 'Card has expired!',
            'number.max': 'Invalid expiry month!'
          })
      })
      .required(),
    csv: Joi.string()
      .length(3)
      .pattern(/^[0-9]+$/, 'numbers')
      .message('Invalid csv')
  }).validate(data)
