import mongoose = require('mongoose')
import { BloxContract } from '../utils/blox.contract'
import { EtherScanAPIContract } from './../utils/etherscan.contract'
const db = require('../models')
const Drop = require('../models/drop.model')
import { uploadFile } from '../utils/fileUpload'
const achievement = require('../achievement')
const _ = require('lodash')

interface Payment {
  txHash: String
  price: number
}

interface MintItem {
  tokenId: String
  mintedOn: number
  recipient: String
  payment: Payment
}

const CHAIN_NAMES = {
  1: 'ethereum',
  3: 'ropsten', // not supported
  4: 'rinkeby',
  5: 'goerli',
  42: 'kovan', // not supported
  137: 'polygon',
  80001: 'mumbai'
}

async function create(req: any, res: any) {
  let drop = req.body
  let image = req.files.image
  drop.user = new mongoose.Types.ObjectId(req.user._id)
  adjustDrop(drop)

  let dbDrop = new Drop(drop)
  dbDrop.title = dbDrop.name // BookCoin patch; remove once devs switch to using name on frontend.

  try {
    // Upload Drop banner image.
    const result = await uploadFile(image)
    let imageUrl = result.Location
    dbDrop.image = imageUrl

    await dbDrop.save()
    console.log(`Creating drop ${dbDrop._id} | ${dbDrop.title}`)

    const premiumTokenIds = drop.premiumTokenIds
    await reserveSpecificNFTsForNewDrop(dbDrop, premiumTokenIds)

    const reservedTokens = await reserveNFTsForNewDrop(dbDrop)

    res.status(200).json({
      message: 'Drop was successfully created!',
      data: dbDrop,
      reservedTokens
    })
  } catch (error) {
    res.status(400).json({
      message: `Error was ${error}`
    })
  }
}

async function dropMint(req: any, res: any) {
  let body = req.body
  let quantity = body.quantity
  let contractName = body.contractName ?? 'BookCoinNFT'
  let smartContractAddress = body.smartContractAddress
  let chain = body.network
  let to = body.to
  let id = body.dropId
  let paymentTxHash = body.paymentTxHash ?? 'NOT_AVAILABLE'

  console.log(
    `dropMint ${quantity}x for contract ${smartContractAddress}-ON-${chain} minted to ${to}`
  )

  if (quantity <= 0) {
    console.log('No NFTs left to mint!')
    res.status(200).json({
      message: `Quantity was <= 0. No NFTs to mint.`,
      data: []
    })
  }

  let drop = await Drop.findOne({
    _id: mongoose.Types.ObjectId(id),
    smartContractAddress,
    chain
  }).populate('user') // Hydrate user object.

  if (drop == null || drop.length == 0) {
    res.status(404).json({
      message: `Drop was not found with ${body.smartContractAddress} on chain ${body.chain} with id ${id}`
    })
    return
  }

  const baseUrl: any = process.env.BLOX_API
  const blox = new BloxContract(baseUrl)
  const validate = true
  if (validate) {
    console.log(`Payment Tx: ${paymentTxHash}`)

    if (paymentTxHash == 'NOT_AVAILABLE') {
      res.status(403).json({
        message: 'There was no payment transaction sent'
      })
    }

    try {
      const txReceiptResponse = await blox.getTransactionReceipt(
        paymentTxHash,
        chain
      )

      const tx = txReceiptResponse.data.tx

      if (!Boolean(tx)) {
        throw new Error(`No transaction found for txHash ${paymentTxHash}`)
      }

      const validationResult: any = validateTransactionReceipt(
        drop,
        to,
        tx,
        chain
      )
      if (!validationResult.valid) {
        console.log(
          `Validation failed for ${paymentTxHash} on ${chain}`,
          validationResult.error
        )
        res.status(403).json({
          error: true,
          message: 'Transaction validation failed',
          validationStatus: validationResult
        })
        return
      }
    } catch (error) {
      console.log(
        `Could not execute validate transfer transaction. For ${paymentTxHash} on ${chain}`
      )
      res.status(501).json({
        error: true,
        message: 'Could not validate transfer transaction.',
        validationStatus: error
      })
      return
    }
  }

  const index = drop.mints.findIndex(
    (mint) => mint.recipient.toUpperCase() === to.toUpperCase()
  )
  let limitMinting = false

  if (hasDateTimeElapsed(drop.publicDateTime)) {
    console.log('Public minting is enabled. Limits are no longer enforced')
    limitMinting = false
  }

  if (limitMinting && index >= 0) {
    console.log(`Address ${to} already minted!`)
    const mint = drop.mints[index]
    res.status(400).json({
      message: `You already minted on ${mint.mintedOn}`
    })
    return
  }

  const remaining = calculateRemaining(drop)

  if (quantity > remaining) {
    console.log(
      `Quantity ${quantity} was greater than remaining ${remaining} so adjusting accordingly.`
    )
    quantity = remaining
  }

  if (remaining == 0) {
    console.log('There are no more NFTs to mint in this drop!')
    res.status(500).json({
      message: 'There are no more NFTs to mint in this drop!'
    })
    return
  }

  const tokenIds = fetchTokenIds(quantity, drop)
  console.log(`Preparing to mint tokenIds ${tokenIds.join()}`)

  if (tokenIds.length == 0) {
    console.log('There were no tokenIds left to mint.')
    res.status(400).json({
      message: 'There were no tokenIds left to mint.'
    })
    return
  }

  const price = drop.price
  await updateDropWithMints(price, paymentTxHash, drop, to, tokenIds)

  let response: any = {
    data: {
      message: 'empty',
      transactions: [
        {
          tx: 'Could not mint.'
        }
      ]
    }
  }
  let txHash = 'Not minted.'
  try {
    response = await blox.dropMint(
      quantity,
      tokenIds,
      to,
      contractName,
      smartContractAddress,
      chain
    )

    const message = response
      ? response.data
        ? response.data.message
        : 'No data on response'
      : 'No response'
    console.log(
      `Mint was successful. Response from BLOX API:response was ${message}`
    )
    txHash = fetchTransactionFromResponse(response)

    await dropMintUpdateManyWithBlockchainStatus(
      drop,
      to,
      tokenIds,
      txHash,
      true,
      1
    )

    await achievement.mintAchievement(drop.user._id)

    res.status(200).json({
      message: `Successfully minted ${quantity} to ${to}`,
      data: response.data
    })
    return
  } catch (error) {
    console.log('There was an error attempting to mint', error)
    const result = await dropMintUpdateManyWithBlockchainStatus(
      drop,
      to,
      tokenIds,
      txHash,
      false,
      1
    )
    res.status(400).json({
      message: `Could not execute mint. Error was ${error}`
    })
    return
  }
}

function validateTransactionReceipt(drop, sender, tx, chain) {
  const from = tx.from
  const to = tx.to
  const chainId = Number.parseInt(tx.chainId, 16)
  const chainName = CHAIN_NAMES[chainId]

  const validTx = Boolean(tx)
  const validSender = from.toUpperCase() === sender.toUpperCase()
  const validRecipient = drop.paymentOwner.toUpperCase() === to.toUpperCase()
  const validChain = chainName === chain

  const validGas = tx.gas === 21000
  const validInput = tx.input === '0x'
  // tx.value := value of Ether transfer in GWEI, 20_000_000_000_000_000 = 0.02 Ether
  const dropPrice = drop.price * 1_000_000_000_000_000_000 // Ether price converted to GWEI.
  const validTransferAmount = tx.value > dropPrice
  const valid =
    validTx &&
    validSender &&
    validRecipient &&
    validChain &&
    validGas &&
    validInput &&
    validTransferAmount
  const validationResult = {
    valid,
    validTx,
    validSender,
    validRecipient,
    validChain,
    validGas,
    validInput,
    validTransferAmount
  }
  return validationResult
}

/**
 * Drops store their FAQs/Sections as a stringified JSON. We just parse it before handing it off to the frontend.
 */
function adjustDrops(drops) {
  for (let i = 0; i < drops.length; i++) {
    const drop = drops[i]
    adjustDrop(drop)
  }
}

function adjustDrop(drop) {
  let sections
  let premiumTokenIds
  let launchDateMillis
  let publicDateMillis
  try {
    sections = JSON.parse(drop.sections)
    premiumTokenIds = drop.premiumTokenIds.split(',')
    launchDateMillis = new Date(drop.launchDateTime).getTime()
    publicDateMillis = new Date(drop.publicDateTime).getTime()
  } catch (error) {
    // If it's already a JSON, skip. If it doesn't exist, that's fine too.
    sections = drop.sections
    premiumTokenIds = drop.premiumTokenIds
    launchDateMillis = Date.now()
    publicDateMillis = Date.now()
  }

  drop.sections = sections
  drop.premiumTokenIds = premiumTokenIds
  drop.launchDateMillis = launchDateMillis
  drop.publicDateMillis = publicDateMillis
}

async function find(req: any, res: any) {
  try {
    let drops = await Drop.find().populate('user')
    adjustDrops(drops)
    res.status(200).json({
      message: 'Drops exist!',
      data: drops
    })
  } catch (error) {
    res.status(400).json({
      message: error
    })
  }
}

async function findOne(req: any, res: any) {
  const dropId = req.params.id

  try {
    let drop = await Drop.findById(dropId).populate('user')
    adjustDrop(drop)
    res.status(200).json({
      message: 'Drop exist!',
      data: drop
    })
  } catch (error) {
    res.status(400).json({
      message: error
    })
  }
}

async function getEtherScanOracle(req: any, res: any) {
  const baseUrl: any = process.env.ETHERSCAN_API_URL
  const apiKey: any = process.env.ETHERSCAN_API_KEY
  const etherScanAPI = new EtherScanAPIContract(baseUrl, apiKey)

  try {
    const response = await etherScanAPI.getGasOracle()
    res.status(200).json({
      message: 'Successfully retrieve etherscan API',
      data: response.data
    })
  } catch (error) {
    res.status(503).json(error)
  }
}

async function reserveSpecificNFTsForNewDrop(drop, tokenIds: string[]) {
  return reserveNFTsForNewDrop(drop, tokenIds)
}

async function reserveNFTsForNewDrop(drop, tokenIds: string[] = []) {
  tokenIds.length > 0
    ? console.log(`Reserving specific tokenIds for premium. ${tokenIds.join()}`)
    : console.log(
        `Dynamically reserving ${drop.reservationNumber} NFTs for reserves.`
      )

  let to = 'premium'
  let txHash = 'PREMIUM_NO_TX_HASH'
  if (tokenIds.length === 0) {
    to = 'reserved'
    txHash = 'RESERVED_NO_TX_HASH'
    tokenIds = fetchTokenIds(drop.reservationNumber, drop)
  }

  await updateDropWithMints(0, txHash, drop, to, tokenIds)
  return tokenIds
}

function hasDateTimeElapsed(datetime: string) {
  const deadlineDate = new Date(datetime)
  const deadlineTime = deadlineDate.getTime()

  const nowDate = new Date()
  const nowTime = nowDate.getTime()

  if (nowTime >= deadlineTime) {
    return true
  }

  return false
}

/**
 * Drops store their FAQs/Sections as a stringified JSON. We just parse it before handing it off to the frontend.
 */

function fetchTokenIds(quantity: number, drop: typeof Drop): string[] {
  let mints: MintItem[] = drop.mints

  const dropSize = drop.standardTokens + drop.premiumTokens
  const startTokenId = 1
  const endTokenId = dropSize

  let initialTokenIds = _.range(startTokenId, endTokenId + 1)
  console.log(
    `Starting with ${initialTokenIds.length} from ${startTokenId} to ${endTokenId}. ${mints.length} existing mints detected.`
  )

  mints.forEach((mint) => {
    let mintedTokenId = mint.tokenId
    let index = initialTokenIds.findIndex((availableTokenId) => {
      return availableTokenId.toString() == mintedTokenId.toString()
    })
    if (index >= 0) {
      initialTokenIds.splice(index, 1)
    }
  })

  const remaining: any[] = initialTokenIds
  console.log(`${initialTokenIds.length} available tokenIds remain.`)
  const tokenIds: any[] = []

  while (quantity > 0) {
    let randomIndex = Math.floor(Math.random() * remaining.length)
    let tokenId = remaining[randomIndex]
    tokenIds.push(tokenId)
    remaining.splice(randomIndex, 1)
    quantity -= 1
  }

  return tokenIds
}

async function updateDropWithMints(
  price: number,
  paymentTxHash: string,
  drop: any,
  recipient: string,
  tokenIds: any
) {
  let mints: MintItem[] = drop.mints

  let payment = {
    price,
    txHash: paymentTxHash
  }

  tokenIds.forEach((tokenId) => {
    let mintedOn: number = Date.now()
    let mintItem: MintItem = {
      tokenId,
      mintedOn,
      recipient,
      payment
    }

    mints.push(mintItem)
  })

  return await drop.save()
}

function calculateRemaining(drop: any) {
  const dropSize = drop.standardTokens + drop.premiumTokens

  const numberOfMints = drop.mints ? drop.mints.length : 0 // will contain both premium (reserved) and standard reserved NFTs before any NFTs are actually minted.

  return dropSize - numberOfMints
}

async function dropMintUpdateManyWithBlockchainStatus(
  drop: any,
  to: any,
  tokenIds: string[],
  txHash: string,
  success: boolean,
  quantity: number
) {
  const dbResult = await Drop.updateMany(
    { _id: drop._id, 'mints.tokenId': { $in: tokenIds } }, // search for this specific drop, and this specific mint item in the array that matches criteria
    {
      $set: {
        'mints.$[].txHash': txHash,
        'mints.$[].confirmed': success,
        'mints.$[].success': success,
        'mints.$[].quantity': quantity
      }
    }
  )

  return dbResult
}

function fetchTransactionFromResponse(response: any) {
  let txHash
  try {
    txHash = response.data.transactions[0].tx
  } catch (error) {
    txHash = 'Error while trying to fetch transaction hash. '
  }

  return txHash
}

module.exports = {
  create,
  dropMint,
  find,
  findOne,
  getEtherScanOracle
}
