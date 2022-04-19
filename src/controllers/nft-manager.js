var express = require('express')
var router = express.Router()
const fs = require('fs')
const path = require('path')

const subRoute = 'blockchain'
const stagingUri = 'https://mega-cat-labs-playground.herokuapp.com'
router.get('/', function (req, res, next) {
  res.send('Youve found the NFT Manager')
})

// "Landing Page" for external link for collection
router.get('/staging/collection/:id', async function (req, res, next) {
  const collectionId = req.params.id
  res.send(`This is the landing page for NFT Collection ${collectionId}`)
})

// Collection metadata for contractUri
router.get(
  '/staging/collection/:collectionId/metadata',
  async function (req, res, next) {
    let collectionId = req.params.collectionId

    const response = {
      collectionId,
      name: 'Mega Cat Labs NFT Collection',
      description:
        'Welcome to the wonderous world of furry felines. These NFTs have been airdropped to you by Mega Cat Labs',
      image: `${stagingUri}/${subRoute}/staging/collection/${collectionId}/images/collection.png`,
      external_link: `${stagingUri}/${subRoute}/collection/${collectionId}`,
      seller_fee_basis_points: 100,
      fee_recipient: '0xd954F4513BdE1E00F3986630A7e73c4f9aA564fE'
    }

    res.send(response)
  }
)

// Token metadata for tokenUri
router.get(
  '/staging/collection/:collectionId/token/:tokenId',
  async function (req, res, next) {
    const collectionId = req.params.collectionId
    const tokenId = req.params.tokenId

    // TODO: Build out infrastructure for storing and dynamically fetching this information.

    const imageUrl = `${stagingUri}/${subRoute}/staging/collection/${collectionId}/token/${tokenId}/image`
    let metadata = {
      name: `Test Token ${tokenId}`,
      collection: `Mega Cat Labs ${collectionId}`,
      image: imageUrl,
      attributes: [
        {
          trait_type: 'Rank',
          value: 'Mega Cat'
        },
        {
          trait_type: 'Skin',
          value: 'Calico'
        },
        {
          trait_type: 'Felineness',
          value: 'Full-bodied Furry'
        },
        {
          trait_type: 'Deployment',
          value: 'MCL Marketplace'
        },
        {
          trait_type: 'Frame',
          value: 'Pawwed'
        },
        {
          display_type: 'number',
          trait_type: 'Claw Sharpness',
          value: '100'
        }
      ]
    }

    const collectionsFolder = path.join(
      __dirname,
      `../static/collections/${collectionId}`
    )
    const collectionsMetadataPath = path.join(
      collectionsFolder,
      `${tokenId}.json`
    )
    if (
      fs.existsSync(collectionsFolder) &&
      fs.existsSync(collectionsMetadataPath)
    ) {
      metadata = JSON.parse(fs.readFileSync(collectionsMetadataPath))
    }

    metadata.image = imageUrl

    res.send(metadata)
  }
)

router.get(
  `/staging/collection/:collectionId/token/:tokenId/image`,
  async function (req, res, next) {
    const collectionId = req.params.collectionId
    const tokenId = req.params.tokenId

    const defaultFilePath = path.join(__dirname, `../static/collection.png`)
    let filePath = defaultFilePath

    const collectionsFolder = path.join(
      __dirname,
      `../static/collections/${collectionId}`
    )
    const tokenImagePath = path.join(collectionsFolder, `${tokenId}.png`)
    if (fs.existsSync(collectionsFolder) && fs.existsSync(tokenImagePath)) {
      filePath = tokenImagePath
    }

    res.sendFile(filePath)
  }
)

// Collection image serving endpoint
router.get(
  '/staging/collection/:collectionId/images/:fileName',
  async function (req, res, next) {
    const collectionId = req.params.collectionId
    let fileName = req.params.fileName

    console.log(`Looking up image ${fileName} for collection ${collectionId}`)

    const defaultFilePath = path.join(__dirname, `../static/collection.png`)
    let filePath = defaultFilePath

    const collectionsFolder = path.join(
      __dirname,
      `../static/collections/${collectionId}`
    )
    const collectionsImagePath = path.join(collectionsFolder, fileName)
    if (
      fs.existsSync(collectionsFolder) &&
      fs.existsSync(collectionsImagePath)
    ) {
      filePath = collectionsImagePath
    }

    res.sendFile(filePath)
  }
)

module.exports = router
