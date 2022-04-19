const express = require('express')
const router = express.Router()
const achievementController = require('../controllers/achievement.controller')
import { authenticateToken } from '../middlewares'

router.post('/', achievementController.create)
router.post('/user', achievementController.user)
router.patch('/:id', achievementController.update)
router.get('/', achievementController.get)
router.post('/user/:achieveId', achievementController.getByAchieveId)

module.exports = router
