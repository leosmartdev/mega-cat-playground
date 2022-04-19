const express = require('express')
const router = express.Router()
const sheetsController = require('../controllers/sheets.controller')
import { cache } from '../utils/caching'

router.get('/whitelist/:id', sheetsController.fetchWhitelist) // cant use authenticateToken becuase we have to allow users to not be "logged in" on frontend for drops
router.get('/whitelist/drop/:id', sheetsController.fetchWhitelistForDrop)
router.post('/whitelist/create', sheetsController.create)
module.exports = router
