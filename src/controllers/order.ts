import mongoose from 'mongoose'
import express from 'express'
import dotenv from 'dotenv'
import { buyOffer } from '../utils/venlyUtils'
import db from '../models'
import Order, {
  CartItem,
  OrderPayload,
  OrderResponse,
  OrdersResponse,
  Offer
} from '../models/order'
import { Body, Example, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import { orderExample, ordersExample } from './api-examples/example'
import Auction from '../models/auction'

dotenv.config()

const Payout = db.payout
const User = db.users
const achievement = require('../achievement')
require('dotenv').config()
const Product = db.products
const Offer = db.offer

@Route('order')
@Tags('Order')
export class OrderController {
  /**
   * @summary Create Order with the provided items
   *
   */
  @Example<OrderResponse>(orderExample)
  @Security('bearerAuth')
  @Post('/create')
  public async create(
    @Request() req: express.Request,
    @Body() body: OrderPayload
  ): Promise<OrderResponse> {
    const items: CartItem[] = JSON.parse(body.items)

    const auctions = await Auction.find({})
    const offerIdsForAuctions = auctions.map((auction) => auction.offerId)

    const allOffers: Promise<Offer[]> = Promise.all(
      items.map(async (item) => {
        const nft = await Product.findOne({
          $and: [{ tokenId: item.tokenId }, { collectionId: item.collection }]
        })
        // TODO: Wrap all items up into single Order...

        if (nft == null) {
          // TODO: We need to create the NFT in our database if its not found!
          // -> Venly sees all NFTs in a user's wallet, including ones created in other smart contracts
          // -> We need to support all NFTs; not just the ones created on our platform.
          throw {
            code: 400,
            message: `Could not find NFT with tokenId ${item.tokenId}`,
            data: []
          }
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

        const order = new Order({
          nftId: item._id,
          nftName: item.name,
          nftPrice: item.price,
          nftImage: item.image,
          tokenId: item.tokenId,
          sellerAddress: item.sellerAddress,
          buyerAddress: body.walletAddress
        })
        await order.save()

        const data = {
          offerId: item._id,
          walletAddress: body.walletAddress,
          username: body.userName
        }

        const promise: Promise<Offer> = buyOffer(data)
        const platformFee = process.env.PLATFORM_FEE
        console.log('order id for payout is: ' + order._id)

        let payout = new Payout({
          nftId: item._id,
          nftName: item.name,
          nftPrice: item.price,
          platformFee: Number(platformFee) * 100,
          payoutAmount: item.price - item.price * Number(platformFee),
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

    const buyOffers = await allOffers

    let atLeastOneFailure = false
    buyOffers.forEach((offerResult) => {
      if (!offerResult.success) {
        atLeastOneFailure = true
      }
    })

    if (atLeastOneFailure)
      throw {
        code: 400,
        message: 'One or more items failed.',
        data: buyOffers
      }

    items.forEach((item) => {
      if (offerIdsForAuctions.includes(item._id)) {
        const relevantAuction = auctions.find(
          (auction) => auction.offerId === item._id
        )
        if (relevantAuction) {
          relevantAuction.isClaimed = true
          console.log(`Auction ${relevantAuction.id} is claimed!`)
          relevantAuction.save()
        }
      }
    })

    return {
      message: 'Order successfully created and offers available',
      data: buyOffers
    }
  }

  /**
   * @summary Get all placed Orders
   *
   */
  @Example<OrdersResponse>(ordersExample)
  @Get('/index')
  public async getOrders(): Promise<OrdersResponse> {
    const orders = await Order.find()

    return {
      message: 'Orders was successfully get!',
      data: orders
    }
  }
}
