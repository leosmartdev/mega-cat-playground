import db from './models'
const mongoose = require('mongoose')

const achievementController = require('./controllers/achievement.controller')
const Achivement = db.achivement
const Product = db.products
const User = db.users
const Collection = db.collections
import Auction from './models/auction'
const MarketOrder = db.marketOrder
import { broadcastNewAchieve } from './socket'
const achievementData = require('./achievementData.json')

// common func in module
async function checkIfExistInAchievement(userId, achieveId) {
  let result = await Achivement.findOne({
    userid: userId,
    achievementId: achieveId
  })
  return result ? true : false
}

// Have at least five or twenty five purchased NFTs in your collection
function havePurchasedNFTsInCollectionAchievement(
  nftid,
  nftname,
  nftimage,
  userId
) {
  return new Promise(async (resolve) => {
    let countProducts = await Product.count({
      userId: userId
    })
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    if (countProducts == 5) {
      let achieveVal = {
        ...achievementData.collector,
        ...{
          nftid: nftid,
          nftname: nftname,
          image: nftimage,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    } else if (countProducts == 25) {
      let achieveVal = {
        ...achievementData.avid_collector,
        ...{
          nftid: nftid,
          nftname: nftname,
          image: nftimage,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

// Purchase your first NFT on MCL
function firstBuyAchievement(nftid, nftname, nftimage, tokenId, userId) {
  return new Promise(async (resolve) => {
    let checkIfExists = await Product.findOne({
      userId: userId,
      tokenId: { $ne: tokenId }
    })
    if (!checkIfExists) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        userId = String((await User.findOne({ googleId: userId }))._id)
      }
      let achieveVal = {
        ...achievementData.first_time_buyer,
        ...{
          nftid: nftid,
          nftname: nftname,
          image: nftimage,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

// Purchase your first NFT on MCL
function firstAvatarAchievement(userId) {
  return new Promise(async (resolve) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    const checkIfExistInList = await checkIfExistInAchievement(
      userId,
      achievementData.first_time_avatar.achievementId
    )
    if (!checkIfExistInList) {
      let achieveVal = {
        ...achievementData.first_time_avatar,
        ...{
          nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
          nftname: 'test-nft feb08',
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

/**
 * Create Auction Achievement...
 *  */
function firstAuctionAchievement(userId, offerId) {
  return new Promise(async (resolve) => {
    let checkIfExists = await Auction.count({
      ownerId: mongoose.Types.ObjectId(userId)
    })
    if (checkIfExists == 1) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        userId = String((await User.findOne({ googleId: userId }))._id)
      }
      let achieveVal = {
        ...achievementData.digital_roadshow,
        ...{
          nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
          nftname: 'test-nft feb08',
          offerId: offerId,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

/**
 * Achievement Block...
 *  */
function tradeNFTAchievements(userId) {
  return new Promise(async (resolve) => {
    let countProducts = await MarketOrder.count({
      userId: mongoose.Types.ObjectId(userId)
    })
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    if (countProducts == 1) {
      let achieveVal = {
        ...achievementData.barterdom,
        ...{
          nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
          nftname: 'test-nft feb08',
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    } else if (countProducts == 5) {
      let achieveVal = {
        ...achievementData.trading_post,
        ...{
          nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
          nftname: 'test-nft feb08',
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

function firstListForSellAchievement(tokenId, userId) {
  return new Promise(async (resolve) => {
    let checkIfExistsUser = await User.findOne({
      _id: mongoose.Types.ObjectId(userId),
      $or: [
        { isListForSell: { $exists: false } },
        { isListForSell: { $in: [null, false] } }
      ]
    })
    if (checkIfExistsUser) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        userId = String((await User.findOne({ googleId: userId }))._id)
      }
      let nft = await Product.findOne({
        tokenId: tokenId
      })
      let achieveVal = {
        ...achievementData.moving_assets,
        ...{
          nftid: tokenId,
          nftname: nft.name,
          image: nft.image,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      checkIfExistsUser.isListForSell = true
      await checkIfExistsUser.save()
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

// merchant achievement
function nftListedForSellAchievement(tokenId, userId) {
  return new Promise(async (resolve) => {
    let checkIfExistsUser = await Product.count({
      userId: mongoose.Types.ObjectId(userId),
      isListForSell: true
    })
    let nft = await Product.findOne({
      tokenId: tokenId
    })
    nft.isListForSell = true
    await nft.save()
    if (checkIfExistsUser == 5) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        userId = String((await User.findOne({ googleId: userId }))._id)
      }
      let achieveVal = {
        ...achievementData.merchant,
        ...{
          nftid: tokenId,
          nftname: nft.name,
          image: nft.image,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

/**
 * Win Auction Achievements Block..
 */
function winAuctionAchievement(userId, nftId, bidsLength) {
  return new Promise(async (resolve) => {
    let checkIfExistsUser = await Auction.count({
      winnerId: mongoose.Types.ObjectId(userId)
    })
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    if (checkIfExistsUser == 1) {
      let nft = await Product.findOne({
        _id: mongoose.Types.ObjectId(nftId)
      })
      let achieveVal = {
        ...achievementData.big_bidder,
        ...{
          nftid: nftId,
          nftname: nft.name,
          image: nft.image,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    } else if (checkIfExistsUser == 5) {
      let nft = await Product.findOne({
        _id: mongoose.Types.ObjectId(nftId)
      })
      let achieveVal = {
        ...achievementData.bidding_enjoyer,
        ...{
          nftid: nftId,
          nftname: nft.name,
          image: nft.image,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    if (bidsLength >= 10) {
      let nft = await Product.findOne({
        _id: mongoose.Types.ObjectId(nftId)
      })
      let achieveVal = {
        ...achievementData.top_of_the_class,
        ...{
          nftid: nftId,
          nftname: nft.name,
          image: nft.image,
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

// user credit achievement
function userCreditAchievement(userId) {
  return new Promise(async (resolve) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    const user = await User.findById(userId)
    const now = new Date()
    // check long term commitment
    if (now.getTime() - user.createdAt.getTime() > 365 * 24 * 60 * 60 * 1000) {
      const checkIfExistInList = await checkIfExistInAchievement(
        userId,
        achievementData.long_term_commitment.achievementId
      )
      if (!checkIfExistInList) {
        let achieveVal = {
          ...achievementData.long_term_commitment,
          ...{
            nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
            nftname: 'test-nft feb08',
            state: 'Unlocked',
            userid: String(userId)
          }
        }
        broadcastNewAchieve(userId, achieveVal)
        resolve(await achievementController.createWithType(achieveVal))
      }
    }
    // check dedication
    if (user.countConsecutiveDays >= 5) {
      const checkIfExistInList = await checkIfExistInAchievement(
        userId,
        achievementData.dedication.achievementId
      )
      if (!checkIfExistInList) {
        let achieveVal = {
          ...achievementData.dedication,
          ...{
            nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
            nftname: 'test-nft feb08',
            state: 'Unlocked',
            userid: String(userId)
          }
        }
        broadcastNewAchieve(userId, achieveVal)
        resolve(await achievementController.createWithType(achieveVal))
      }
    }
    // check super fan
    if (user.countConsecutiveWeeks >= 54) {
      const checkIfExistInList = await checkIfExistInAchievement(
        userId,
        achievementData.super_fan.achievementId
      )
      if (!checkIfExistInList) {
        let achieveVal = {
          ...achievementData.super_fan,
          ...{
            nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
            nftname: 'test-nft feb08',
            state: 'Unlocked',
            userid: String(userId)
          }
        }
        broadcastNewAchieve(userId, achieveVal)
        resolve(await achievementController.createWithType(achieveVal))
      }
    }
    resolve(false)
  })
}

// art broker achievement
function artBrokerAchievement(nftid, nftname, nftimage, userId) {
  return new Promise(async (resolve) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    const user = await User.findById(userId)
    // check long term commitment
    if (user.sellCount >= 25) {
      const checkIfExistInList = await checkIfExistInAchievement(
        userId,
        achievementData.art_broker.achievementId
      )
      if (!checkIfExistInList) {
        let achieveVal = {
          ...achievementData.art_broker,
          ...{
            nftid: nftid,
            nftname: nftname,
            image: nftimage,
            state: 'Unlocked',
            userid: String(userId)
          }
        }
        broadcastNewAchieve(userId, achieveVal)
        resolve(await achievementController.createWithType(achieveVal))
      }
    }
    resolve(false)
  })
}

// user profile achievement
function userProfileAchievement(userId) {
  return new Promise(async (resolve) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    const user = await User.findById(userId)
    // check user profile
    const profileFields = [
      'username',
      'usernameOrEmail',
      'bio',
      'role',
      'avatar',
      'circleWalletId'
    ]
    let isFullProfile = true
    for (let index = 0; index < profileFields.length; index++) {
      const element = profileFields[index]
      if (!(element in user) || user[element] === undefined) {
        isFullProfile = false
        break
      }
    }
    if (isFullProfile) {
      const checkIfExistInList = await checkIfExistInAchievement(
        userId,
        achievementData.put_yourself_out_there.achievementId
      )
      if (!checkIfExistInList) {
        let achieveVal = {
          ...achievementData.put_yourself_out_there,
          ...{
            nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
            nftname: 'test-nft feb08',
            state: 'Unlocked',
            userid: String(userId)
          }
        }
        broadcastNewAchieve(userId, achieveVal)
        resolve(await achievementController.createWithType(achieveVal))
      }
    }
    resolve(false)
  })
}

// well Rounded achievement
function wellRoundedAchievement(userId, type) {
  return new Promise(async (resolve) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    const checkIfExistInList = await checkIfExistInAchievement(
      userId,
      achievementData.well_rounded.achievementId
    )
    if (!checkIfExistInList) {
      let achieveVal = {
        ...achievementData.well_rounded,
        ...{
          nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
          nftname: 'test-nft feb08',
          state: 'Inprogress',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    } else {
      // to update state
    }
    resolve(false)
  })
}

// mint achievement
function mintAchievement(userId) {
  return new Promise(async (resolve) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    const checkIfExistInList = await checkIfExistInAchievement(
      userId,
      achievementData.creative_first.achievementId
    )
    if (!checkIfExistInList) {
      let achieveVal = {
        ...achievementData.creative_first,
        ...{
          nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
          nftname: 'test-nft feb08',
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

// big money moves achievement
function bigMoneyMovesAchievement(userId) {
  return new Promise(async (resolve) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    const checkIfExistInList = await checkIfExistInAchievement(
      userId,
      achievementData.big_money_moves.achievementId
    )
    if (!checkIfExistInList) {
      let achieveVal = {
        ...achievementData.big_money_moves,
        ...{
          nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
          nftname: 'test-nft feb08',
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

// lucky achievement
function luckyAchievement(userId) {
  return new Promise(async (resolve) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      userId = String((await User.findOne({ googleId: userId }))._id)
    }
    const checkIfExistInList = await checkIfExistInAchievement(
      userId,
      achievementData.lucky.achievementId
    )
    if (!checkIfExistInList) {
      let achieveVal = {
        ...achievementData.lucky,
        ...{
          nftid: '9022fa54-5b92-458b-bfc8-a48f0a110d9e',
          nftname: 'test-nft feb08',
          state: 'Unlocked',
          userid: String(userId)
        }
      }
      broadcastNewAchieve(userId, achieveVal)
      resolve(await achievementController.createWithType(achieveVal))
    }
    resolve(false)
  })
}

module.exports = {
  havePurchasedNFTsInCollectionAchievement,
  firstBuyAchievement,
  firstAvatarAchievement,
  firstAuctionAchievement,
  tradeNFTAchievements,
  firstListForSellAchievement,
  nftListedForSellAchievement,
  winAuctionAchievement,
  userCreditAchievement,
  artBrokerAchievement,
  userProfileAchievement,
  wellRoundedAchievement,
  bigMoneyMovesAchievement,
  luckyAchievement,
  mintAchievement
}
