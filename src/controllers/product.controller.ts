import Auction from '../models/auction'
import { getUrlFromKey } from '../utils/fileUpload'

const db = require('../models')
const achievement = require('../achievement')
const { uploadFile, getUrl } = require('./../utils/fileUpload')
const mongoose = require('mongoose')
const Product = db.products
const User = db.users
const Collection = db.collections
const MEGACAT_STUDIOS_SELLER_ID = 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67'

const {
  createTokenType,
  createToken,
  getTokensByWalletAddress,
  getAllNFTsForWalletAddress,
  createOfferSale,
  getPrepareTransaction,
  addOfferTxApprove,
  addOfferSignature,
  getNFTsByStatus,
  retrieveNftMetadata,
  retrieveNftMetadataByAddressAndId,
  editMetadata,
  createCollection,
  getCollectionAddress,
  editOffer,
  cancelOffer
} = require('../utils/venlyUtils')
const axios = require('axios')
const { collections } = require('../models')
const { Iot } = require('aws-sdk')
require('dotenv').config()

// Create and Save a new Product
exports.create = async (req: any, res: any) => {
  try {
    const images: any[] = []
    let image = null

    if (req.files.images.length == undefined) {
      const result = await uploadFile(req.files.images)
      image = result.Location
    } else {
      for (let i = 0; i < req.files.images.length; i++) {
        const result = await uploadFile(req.files.images[i])
        image = result.Location
        let media = {
          type: 'image',
          value: result.Location
        }
        images.push(media)
      }
    }

    let productData = {
      name: req.body.name,
      description: req.body.description,
      image: image,
      attributes: JSON.parse(req.body.properties),
      media: images
    }
    let templateId
    if (req.body.collectionId) {
      templateId = await createTokenType(productData, req.body.collectionId)
    } else {
      templateId = await createTokenType(productData, null)
    }

    if (templateId == null) {
      res.status(500).json({
        error: 'Failed to create template for NFT; cannot mint the actual NFT.'
      })
    }

    let data = {
      id: templateId,
      walletAddress: req.body.walletAddress,
      supply: req.body.supply
    }
    let NFTProduct
    if (req.body.collectionId) {
      NFTProduct = await createToken(data, req.body.collectionId)
    } else {
      NFTProduct = await createToken(data, null)
    }

    let singleNFT = NFTProduct[0]

    let product = new Product({
      name: req.body.name,
      description: req.body.description,
      properties: JSON.parse(req.body.properties),
      image: image,
      templateId: templateId,
      tokenId: singleNFT.tokenIds[0],
      collectionId: req.body.mongoCollectionId,
      contractAddress: singleNFT.metadata.contract.address,
      venly: singleNFT,
      userId: req.user._id
    })

    // TODO: Add creator information.
    let createdProduct = await product.save()

    res.status(200).json({
      message: 'Product was successfully created!',
      data: NFTProduct
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

exports.createCollection = async (req: any, res: any) => {
  try {
    console.log(req.body)
    const images: any[] = []
    let image = null
    let lottie = null
    let collection = new Collection({
      name: req.body.name,
      ownerAddress: req.body.walletAddress,

      userId: req.user._id
    })
    if (req.files.images.length == undefined) {
      const result = await uploadFile(req.files.images)
      image = result.Location
    } else {
      for (let i = 0; i < req.files.images.length; i++) {
        const result = await uploadFile(req.files.images[i])
        image = result.Location
        let media = {
          type: 'image',
          value: result.Location
        }
        images.push(media)
      }
    }

    if ('lottie' in req.files) {
      const result = await uploadFile(req.files.lottie)
      lottie = result.Location
    }

    let media = [
      {
        type: 'image',
        value: image
      },
      {
        type: 'collectionId',
        value: collection._id.toString()
      }
    ]

    if (req.body.story) {
      media.push({
        type: 'royality',
        value: req.body.royality
      })
      media.push({
        type: 'story',
        value: req.body.story
      })
      media.push({
        type: 'perks',
        value: req.body.perks
      })
      media.push({
        type: 'subheading',
        value: req.body.subheading
      })
      media.push({
        type: 'about',
        value: req.body.about
      })
    }

    let data = {
      name: req.body.name,
      description: req.body.description,
      chain: 'MATIC',
      symbol: req.body.symbol,
      image: image,
      media: media,
      externalUrl: image
    }

    let contractData = await createCollection(data)

    collection.collectionId = contractData.id

    if (req.body.story) {
      collection.royality = req.body.royality
      collection.story = req.body.story
      collection.perks = req.body.perks
      collection.subheading = req.body.subheading
      collection.about = req.body.about
      collection.lottie = lottie
    }
    await collection.save()
    let responseBody = {
      collection: contractData
    }

    res.status(200).send(responseBody)
  } catch (error) {
    console.log(error)
    res.status(400).json({
      error: error
    })
  }
}

exports.getOneCollection = async (req: any, res: any) => {
  console.log('in collection')

  try {
    let collection = await Collection.findById(req.body.collectionId)
    console.log('collcetion', collection)
    let colDate: any = null
    let avatarUrl: any = null
    let avatar: any = null
    if (collection) {
      console.log('collection found')
      colDate = collection.createdAt
      let user = await User.findById(
        collection.userId,
        'firstName lastName username bio name'
      )
      avatar = await User.findById(collection.userId, 'avatar')
      if (avatar) {
        console.log('avatar found')
        avatarUrl = await getUrlFromKey(avatar.avatar)
        console.log(avatarUrl)
      }
      if (user) {
        res.status(200).json({
          data: user,
          avatar: avatarUrl,
          date: colDate
        })
      } else {
        res.status(400).json({
          error: 'No user found'
        })
      }
    } else {
      res.status(400).json({
        error: 'No collection found'
      })
    }
  } catch (err) {
    console.log('errrrrrrrr', err)
    res.status(400).json({
      error: err
    })
  }
}

exports.getCollectionDetail = async (req: any, res: any) => {
  console.log('in collection')

  try {
    let collection = await Collection.findById(req.body.collectionId)
    console.log('collection', collection)
    if (collection) {
      console.log('collection found')
      res.status(200).json({
        data: collection
      })
    } else {
      res.status(400).json({
        error: 'No collection found'
      })
    }
  } catch (err) {
    console.log('errrrrrrrr', err)
    res.status(400).json({
      error: err
    })
  }
}

exports.getCollections = async (req: any, res: any) => {
  console.log('in get collections')
  try {
    let collections = await Collection.find({
      ownerAddress: req.body.walletAddress
    }).populate('userId')
    if (collections) {
      res.status(200).json({
        collections: collections
      })
    } else {
      res.status(400).json({
        error: 'no collections found'
      })
    }
  } catch (error) {
    console.log(error)
    res.status(400).json({
      error: error
    })
  }
}

exports.editMetadata = async (req: any, res: any) => {
  try {
    let product = await Product.findOne({ templateId: req.body.id })
    const images: any[] = []
    let image = null

    if (req.files.images.length == undefined) {
      const result = await uploadFile(req.files.images)
      image = result.Location
    } else {
      for (let i = 0; i < req.files.images.length; i++) {
        const result = await uploadFile(req.files.images[i])
        image = result.Location
        let media = {
          type: 'image',
          value: result.Location
        }
        images.push(media)
      }
    }

    let productData = {
      name: req.body.name,
      description: req.body.description,
      image: image,
      attributes: JSON.parse(req.body.properties),
      media: images
    }
    let data = {
      templateId: req.body.id,
      product: productData
    }
    let meta = await editMetadata(data)
    if (product) {
      product.name = req.body.name
      product.description = req.body.description
      ;(product.image = image),
        (product.attributes = JSON.parse(req.body.properties))
      product.save()
    }

    res.status(200).json({
      message: 'Metadata successfully updated!',
      data: meta
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

// Find a single Product with an id
exports.findByTokenId = async (req: any, res: any) => {
  try {
    let product = await Product.findOne({ tokenId: req.body.id })
    if (product) {
      res.status(200).json({
        data: product
      })
    } else {
      res.status(400).json({
        error: 'product details not found'
      })
    }
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}

// Retrieve all Products from the database.
exports.findAll = async (req: any, res: any) => {
  const filterQuery: any = {}
  if (req.query.date != 'null') {
    filterQuery.createdAt = req.query.date
  }
  if (req.query.price != 'null') {
    filterQuery.price = req.query.price
  }

  const searchQuery: any = {}
  if (req.query.search) {
    searchQuery.name = { $regex: req.query.search, $options: 'i' }
  }

  try {
    let products = await Product.find(searchQuery).sort(filterQuery)
    res.status(200).json({
      data: products
    })
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}

// Find a single Product with an id
exports.findOne = async (req: any, res: any) => {
  try {
    let product = await Product.findById(req.params.id)
    res.status(200).json({
      data: product
    })
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}

// Update a Product by the id in the request
exports.update = async (req: any, res: any) => {
  try {
    let product = await Product.findById(req.params.id)
    let url = product.image
    if (req.files) {
      const result = await uploadFile(req.files.image)
      url = await getUrl(req.files.image)
    }
    let productObj: any = {
      name: req.body.name,
      description: req.body.description,
      tokenId: req.body.tokenId,
      metadataStatus: req.body.metadataStatus,
      properties: JSON.parse(req.body.properties),
      image: url,
      price: req.body.price
    }
    if (product.price !== undefined) {
      productObj.originPrice = product.price
    }
    let updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      productObj,
      { new: true }
    )

    if (!updatedProduct) {
      return res.status(404).send({
        message: 'Product not found with id ' + req.params.id
      })
    } else {
      res.status(200).json({
        data: updatedProduct
      })
    }
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

// Delete a Product with the specified id in the request
exports.delete = async (req: any, res: any) => {
  try {
    let product = await Product.findByIdAndRemove(req.params.id)
    if (!product) {
      return res.status(404).send({
        message: 'Product not found with id ' + req.params.id
      })
    }
    res.send({ message: 'Product deleted successfully!' })
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}

// Get all NFTS based on wallet address.
exports.getNFTsBasedOnWalletAddress = async (req: any, res: any) => {
  try {
    // let nfts = await getTokensByWalletAddress(req.params.walletAddress);
    let nfts = await getAllNFTsForWalletAddress(req.params.walletAddress)
    res.status(200).json({
      data: nfts
    })
  } catch (error) {}
}

// Get all NFTS based on a user's connected wallet address.
exports.getNFTsBasedOnUserWalletAddressesByUser = async (
  req: any,
  res: any
) => {
  try {
    // let nfts = await getTokensByWalletAddress(req.params.walletAddress);
    let user = await User.findOne({ googleId: req.params.userId })
    let linkedWalletAddresses = user.linkedWalletAddresses
    let nfts: any[] = []
    for (const linkedWalletAddress of linkedWalletAddresses) {
      let nftList = await getAllNFTsForWalletAddress(linkedWalletAddress)
      nfts = [...nfts, ...nftList]
    }
    res.status(200).json({
      data: nfts
    })
  } catch (error) {
    console.log(error)
  }
}

exports.createSaleOffer = async (req: any, res: any) => {
  try {
    const { tokenId, address, sellerAddress, price, userid } = req.body
    let data = {
      tokenId,
      address,
      sellerAddress,
      price
    }
    /* Achievement Block */
    await achievement.firstListForSellAchievement(tokenId, userid)
    await achievement.nftListedForSellAchievement(tokenId, userid)
    /* End Achievement Block */
    let result = await createOfferSale(data)
    let transactionData = await getPrepareTransaction(result.result.id)
    let resData = {
      transaction: transactionData.result,
      offerId: result.result.id
    }

    res.status(200).json({
      message: 'Offer was successfully created!',
      data: resData
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

exports.listSaleOffers = async (req: any, res: any) => {
  try {
    let offers: any[] = []

    const { filter, auctionOffers } = req.query
    const statusFilter =
      filter || 'SOLD,READY,FINALIZING_OFFER,AWAITING_FINALIZING_OFFER'
    await axios
      .get(
        `${process.env.MARKET_API_ENDPOINT}/offers?sellerId=${MEGACAT_STUDIOS_SELLER_ID}&status=${statusFilter}`,
        { headers: { 'Content-Type': 'application/json' } }
      )
      .then((response: any) => {
        offers = response.data.result
      })
      .catch((error: any) => console.log('error', error))

    console.log('auctionOffer: ', auctionOffers)
    let filteredOffers = offers

    if (auctionOffers == 'false') {
      const auction = await Auction.find({})
      const activeOfferIds = auction.map((auction) => auction.offerId)
      filteredOffers = offers.filter(
        (offer) => !activeOfferIds.includes(offer.id)
      )
    }
    res.status(200).json({
      message: 'Offers was successfully get!',
      data: filteredOffers
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

exports.getSpecificSaleOffer = async (req: any, res: any) => {
  try {
    let offer = null
    await axios
      .get(`https://api-staging.arkane.market/offers/${req.params.offerId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((response: any) => {
        offer = response.data.result
      })
      .catch((error: any) => console.log('error', error))

    res.status(200).json({
      message: 'Offer was successfully get!',
      data: offer
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

exports.offerTxApprove = async (req: any, res: any) => {
  try {
    let data = {
      offerId: req.body.offerId,
      transactionHash: req.body.hash
    }
    let result = await addOfferTxApprove(data)
    res.status(200).json({
      message: 'Tax approved successfully!',
      data: result
    })
  } catch (error) {
    res.status(400).json({
      error: error
    })
  }
}

exports.offerSignature = async (req: any, res: any) => {
  try {
    let data = {
      offerId: req.body.offerId,
      dataToSign: req.body.dataToSign
    }
    let result = await addOfferSignature(data)
    res.status(200).json({
      message: 'Offer signature added successfully!',
      data: result
    })
  } catch (error) {
    res.status(400).json({
      error: error
    })
  }
}

exports.getStats = async (req: any, res: any) => {
  try {
    let newNFTs = await getNFTsByStatus('NEW')
    let listedForSaleNFTs = await getNFTsByStatus('READY')
    let soldNFTs = await getNFTsByStatus('SOLD')
    let users = await User.count()
    let result = {
      new: newNFTs.length,
      sale: listedForSaleNFTs.length,
      sold: soldNFTs.length,
      users: users
    }
    res.status(200).json({
      message: 'Stats fetched successfully!',
      data: result
    })
  } catch (error) {
    res.status(400).json({
      error: error
    })
  }
}

exports.getNFtMedata = async (req: any, res: any) => {
  try {
    let result = await retrieveNftMetadata(req.params.id)
    res.status(200).json({
      message: 'Metadata get successfully!',
      data: result
    })
  } catch (error) {
    res.status(400).json({
      error: error
    })
  }
}

exports.getNftMetadataByContract = async (req: any, res: any) => {
  try {
    let result = await retrieveNftMetadataByAddressAndId(
      req.params.contractAddress,
      req.params.tokenId
    )
    res.status(200).json({
      message: 'Metadata get successfully!',
      data: result
    })
  } catch (error) {
    res.status(400).json({
      error: error
    })
  }
}

exports.editOffer = async (req: any, res: any) => {
  if (!req.body.price && !req.body.offerId) {
    return res.status(400).json({
      error: 'Invalid request parameters'
    })
  }
  try {
    let response = await editOffer({
      offerId: req.body.offerId,
      price: req.body.price.toString()
    })
    if (!response.success) {
      return res.status(400).json({ error: 'failed to edit offer' })
    } else {
      return res.status(200).json({ data: response })
    }
  } catch (error) {
    res.status(500).json({
      error: error
    })
  }
}

exports.cancelOffer = async (req: any, res: any) => {
  if (!req.body.offerId) {
    return res.status(400).json({
      error: 'Invalid request parameters'
    })
  }
  try {
    let response = await cancelOffer({
      offerId: req.body.offerId
    })
    if (!response.success) {
      return res.status(400).json({ error: 'failed to cancel offer' })
    } else {
      return res.status(200).json({ data: response })
    }
  } catch (error) {
    res.status(500).json({
      error: error
    })
  }
}
