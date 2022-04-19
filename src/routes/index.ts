import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'

const Product = require('../controllers/product.controller')
const Offer = require('../controllers/offer.controller')
const Role = require('../controllers/role.controller')
const nftRouter = require('../controllers/nft-manager.js')
const dropRouter = require('./drop.routes')
import bookCoinRouter from './bookcoin.routes'
const paymentRouter = require('./payment.routes')
const sheetsRouter = require('./sheets.routes')
const achievementRouter = require('./achievement')

import * as User from '../controllers/user.controller'
import * as MarketOrder from '../controllers/market-order.controller'
import authRouter from './auth'
import auctionRouter from './auction'
import orderRouter from './order'

import {
  authenticateAccessToken,
  filterOffersbeforeProceeding,
  isSuperAdmin,
  isAdmin
} from '../middlewares'
import cardsRouter from './cards'

const router = Router()

router.get('/canary', function (req, res) {
  res.send('Chirp')
})
router.post('/user/register', User.create)
router.post('/user', authenticateAccessToken, User.findOne)
router.post('/user/updateAvatar', authenticateAccessToken, User.updateAvatar)
router.post('/user/updateBanner', authenticateAccessToken, User.updateBanner)
router.post('/user/removeAvatar', authenticateAccessToken, User.removeAvatar)
router.post('/user/updateEmail', authenticateAccessToken, User.updateEmail)
router.post(
  '/user/updatePassword',
  authenticateAccessToken,
  User.updatePassword
)
router.post('/user/updateProfile', authenticateAccessToken, User.updateProfile)
router.post(
  '/user/updateWalletAddresses',
  authenticateAccessToken,
  User.updateWalletAddresses
)
router.post(
  '/user/deleteWalletAddresses',
  authenticateAccessToken,
  User.deleteWalletAddresses
)
router.post(
  '/user/updateLinkedWalletAddresses',
  authenticateAccessToken,
  User.updateLinkedWalletAddresses
)
router.post(
  '/user/deleteLinkedWalletAddresses',
  authenticateAccessToken,
  User.deleteLinkedWalletAddresses
)
router.get('/product/getNFtMedata/:id', Product.getNFtMedata)
router.get(
  '/product/nft/:contractAddress/:tokenId',
  Product.getNftMetadataByContract
)
router.get('/product/getStats', Product.getStats)
router.post('/product/offerTxApprove', Product.offerTxApprove)
router.post('/product/offerSignature', Product.offerSignature)
router.post('/product/createSaleOffer', Product.createSaleOffer)
router.get('/product/listSaleOffers', Product.listSaleOffers)
router.get('/product/offer/:offerId', Product.getSpecificSaleOffer)
router.post('/product/create', authenticateAccessToken, Product.create)
router.post('/product/editOffer', Product.editOffer)
router.post('/product/cancelOffer', Product.cancelOffer)
router.post('/product/updateMeta', Product.editMetadata)
router.post(
  '/product/createCollection',
  authenticateAccessToken,
  Product.createCollection
)
router.post('/product/getCollections', Product.getCollections)
router.post('/product/getOneCollection/', Product.getOneCollection)
router.post('/product/getCollectionDetail/', Product.getCollectionDetail)
router.get('/product/list', Product.findAll)
router.post('/product/:id', Product.update)
router.get('/product/:id', Product.findOne)
router.get('/product/token/:id', Product.findByTokenId)
router.delete('/product/:id', Product.delete)
router.get(
  '/product/getNFTsBasedOnWalletAddress/:walletAddress',
  Product.getNFTsBasedOnWalletAddress
)
router.get(
  '/product/getNFTsBasedOnUserWalletAddressesByUser/:userId',
  Product.getNFTsBasedOnUserWalletAddressesByUser
)
router.post('/offer/create', Offer.create)
router.get('/offer', Offer.index)

//TODO: Remove these model as they are no longer required
router.post('/marketorder/create', MarketOrder.create)
router.get('/marketorder', MarketOrder.index)

router.post(
  '/role/admin',
  authenticateAccessToken,
  isSuperAdmin,
  Role.setAsAdmin
)
router.post('/role/user', authenticateAccessToken, isSuperAdmin, Role.setAsUser)
router.get(
  '/role/getAdmins',
  authenticateAccessToken,
  isSuperAdmin,
  Role.getAllAdmins
)
router.post(
  '/role/getUsers',
  authenticateAccessToken,
  isSuperAdmin,
  Role.getAllUsers
)
router.get(
  '/payouts/pending',
  authenticateAccessToken,
  isAdmin,
  Role.getAllPendingPayouts
)
router.post(
  '/payouts/approve',
  authenticateAccessToken,
  isAdmin,
  Role.approvePayout
)
router.post(
  '/payouts/approveAllPayouts',
  authenticateAccessToken,
  isAdmin,
  Role.approveAllPayouts
)
router.post(
  '/payouts/walletAddress',
  authenticateAccessToken,
  Role.getPayoutsByAddress
)

router.get(
  '/payouts/getBalance',
  authenticateAccessToken,
  Role.getUserBalanceByCircleWallet
)

router.post(
  '/payouts/transferCircleToUserWallet',
  authenticateAccessToken,
  Role.transferCircleToUserWallet
)

router.use('/drops', dropRouter)
router.use('/teams', bookCoinRouter)
router.use('/achievement', achievementRouter)
router.use('/auth', authRouter)

router.use('/blockchain', nftRouter)
router.use('/achievement', achievementRouter)
router.use('/auctions', auctionRouter)
router.use('/order', orderRouter)
router.use('/payment', paymentRouter)
router.use('/sheets', sheetsRouter)
router.use('/cards', authenticateAccessToken, cardsRouter)

router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/swagger.yaml'
    }
  })
)

export default router
