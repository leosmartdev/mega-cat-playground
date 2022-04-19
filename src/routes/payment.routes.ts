const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/payment.controller')
import { authenticateAccessToken } from '../middlewares'

router.get(
  '/getPCIPublicKey',
  authenticateAccessToken,
  paymentController.getPCIPublicKey
)
router.post(
  '/createCard',
  authenticateAccessToken,
  paymentController.createCard
)
router.post(
  '/processPayment',
  authenticateAccessToken,
  paymentController.processPayment
)

module.exports = router
