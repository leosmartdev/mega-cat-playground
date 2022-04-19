const mongoose = require('mongoose')
const db = require('../models')
const Order = db.orders
const Payout = db.payout
const User = db.users
const achievement = require('../achievement')
const { buyOffer } = require('../utils/venlyUtils')
require('dotenv').config()
const Offer = db.offer
const Product = db.products

exports.create = async (req, res) => {
  let atLeastOneFailure = false
  try {
    let items = JSON.parse(req.body.items)

    const allOffers = Promise.all(
      items.map(async (item) => {
        const nft = await Product.findOne({
          $and: [{ tokenId: item.tokenId }, { collectionId: item.collection }]
        })
        // TODO: Wrap all items up into single Order...

        if (nft == null) {
          // TODO: We need to create the NFT in our database if its not found!
          // -> Venly sees all NFTs in a user's wallet, including ones created in other smart contracts
          // -> We need to support all NFTs; not just the ones created on our platform.
          return res.status(400).json({
            message: `Could not find NFT with tokenId ${item.tokenId}`,
            data: []
          })
        }

        /***
         * Achievement Code .. For First Buy..
         **/
        let respFirst = await achievement.firstBuyAchievement(
          item._id,
          item.name,
          item.image,
          item.tokenId,
          mongoose.Types.ObjectId(req.user._id)
        )
        console.log(respFirst, '==> respFirst')
        /***
         * End Achievement Code .. For First Buy..
         **/

        const user = await User.findOne({ _id: nft.userId })
        user.sellCount += 1
        await user.save()

        let respArtAchieve = await achievement.artBrokerAchievement(
          item._id,
          item.name,
          item.image,
          mongoose.Types.ObjectId(req.user._id)
        )
        console.log(respArtAchieve, '==> respArtAchieve')

        // check if relist and sell for at least twice its original value
        if (
          nft.originPrice !== undefined &&
          nft.originPrice !== 0 &&
          nft.price / nft.originPrice >= 2
        ) {
          // award big money moving achievement
          await achievement.bigMoneyMovesAchievement(nft.userId)
        }

        nft.userId = mongoose.Types.ObjectId(req.user._id)
        await nft.save()

        /***
         * Achievement Code .. Collector - Have at least five or twenty five purchased NFTs in your collection..
         **/
        let respSecond =
          await achievement.havePurchasedNFTsInCollectionAchievement(
            item._id,
            item.name,
            item.image,
            mongoose.Types.ObjectId(req.user._id)
          )
        console.log(respSecond, '==> respSecond')
        /***
         * End Achievement Code .. Collector - Have at least five or twenty fivepurchased NFTs in your collection..
         **/

        let order = new Order({
          nftId: item._id,
          nftName: item.name,
          nftPrice: item.price,
          nftImage: item.image,
          tokenId: item.tokenId,
          sellerAddress: item.sellerAddress,
          buyerAddress: req.body.walletAddress
        })
        await order.save()

        let data = {
          offerId: item._id,
          walletAddress: req.body.walletAddress,
          username: req.body.userName
        }

        const promise = buyOffer(data)
        const platformFee = process.env.PLATFORM_FEE
        console.log('order id for payout is: ' + order._id)

        let payout = new Payout({
          nftId: item._id,
          nftName: item.name,
          nftPrice: item.price,
          platformFee: platformFee * 100,
          payoutAmount: item.price - item.price * platformFee,
          sellerAddress: item.sellerAddress,
          nftImage: item.image,
          offerId: item._id,
          sellerCircleWalletID: user.circleWalletId,
          order: new mongoose.Types.ObjectId(order._id)
        })
        await payout.save()
        return promise
      })
    )

    let buyOffers = await allOffers

    buyOffers.forEach((offerResult) => {
      if (!offerResult.success) {
        atLeastOneFailure = true
      }
    })

    if (atLeastOneFailure) {
      res.status(400).json({
        message: 'One or more items failed.',
        data: buyOffers
      })
    } else {
      res.status(200).json({
        message: 'Order successfully created and offers available',
        data: buyOffers
      })
    }
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

// Get all orders of a usr
exports.index = async (req, res) => {
  try {
    let orders = await Order.find()
    res.status(200).json({
      data: orders
    })
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}
