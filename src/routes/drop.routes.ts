const express = require('express')
const router = express.Router()
const dropController = require('../controllers/drop.controller')
import { authenticateAccessToken } from '../middlewares'
import { cache } from '../utils/caching'

router.post('/create', authenticateAccessToken, dropController.create)
router.get('/', dropController.find)
router.get('/:id', dropController.findOne)
router.post('/mint', dropController.dropMint)
router.get('/etherscan/oracle', cache(1), dropController.getEtherScanOracle) // cant use authenticateToken becuase we have to allow users to not be "logged in" on frontend for drops

module.exports = router
