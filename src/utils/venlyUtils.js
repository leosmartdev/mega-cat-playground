const axios = require('axios')
const { contrast } = require('chroma-js')
const userModel = require('../models/user.model')

const getVelyAuthToken = async () => {
  const data = new URLSearchParams()
  data.append('grant_type', 'client_credentials')
  data.append('client_id', process.env.VENLY_CLIENT_ID)
  data.append('client_secret', process.env.VENLY_CLIENT_SECRET)
  let token = null

  await axios
    .post(
      'https://login-staging.arkane.network/auth/realms/Arkane/protocol/openid-connect/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    .then((response) => {
      token = response.data.access_token
    })
    .catch((error) => console.log('error', error))
  return token
}

const createTokenType = async (product, contractId) => {
  let token = await getVelyAuthToken()
  let templateId = null
  let contract = null
  if (contractId) {
    contract = contractId
  } else {
    contract = process.env.VENLY_CONTRACT_ID
  }

  const url = `${process.env.NFT_API_ENDPOINT}/${process.env.VENLY_APP_ID}/contracts/${contract}/token-types`
  await axios
    .post(url, product, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log('Template Creation', response.data)
      templateId = response.data.id
    })
    .catch((error) => console.log('error', error))
  return templateId
}

const createCollection = async (data) => {
  const token = await getVelyAuthToken()

  try {
    const { data: collectionData } = await axios.post(
      `${process.env.NFT_API_ENDPOINT}/${process.env.VENLY_APP_ID}/contracts`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )

    return collectionData
  } catch (err) {
    throw err?.response?.data
  }
}

const getCollectionAddress = async (id) => {
  let token = await getVelyAuthToken()
  let contractAddress = null
  await axios
    .get(
      `${process.env.NFT_API_ENDPOINT}/${process.env.VENLY_APP_ID}/contracts/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      console.log('get address', response.data)
      contractAddress = response.data.address
    })
    .catch((error) => console.log('error', error))
  return contractAddress
}

const createToken = async (data, contractId) => {
  let token = await getVelyAuthToken()
  let body = {
    typeId: data.id,
    destinations: []
  }
  let i = 0
  for (i = 0; i < data.supply; i++) {
    body.destinations.push(data.walletAddress)
  }

  let contract = process.env.VENLY_CONTRACT_ID
  var raw = JSON.stringify(body)
  if (contractId) {
    contract = contractId
  }

  let nftData = null
  await axios
    .post(
      `${process.env.NFT_API_ENDPOINT}/${process.env.VENLY_APP_ID}/contracts/${contract}/tokens/non-fungible`,
      raw,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      console.log('NFT Creation', response.data)
      nftData = response.data
    })
    .catch((error) => console.log('error', error))
  return nftData
}

const editMetadata = async (data) => {
  let token = await getVelyAuthToken()
  let nftData = null
  await axios
    .post(
      `${process.env.NFT_API_ENDPOINT}/${process.env.VENLY_APP_ID}/contracts/${process.env.VENLY_CONTRACT_ID}/token-types/${data.templateId}/metadata`,
      data.product,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      console.log('NFT Creation', response.data)
      nftData = response.data
    })
    .catch((error) => console.log('error', error))
  return nftData
}

async function getAllNFTsForWalletAddress(walletAddress) {
  const secretType = 'MATIC'
  let url = `https://api-staging.arkane.network/api/wallets/${secretType}/${walletAddress}/nonfungibles`
  let token = await getVelyAuthToken()

  let result
  await axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      const success = response.data.success
      result = response.data.result
    })
    .catch((error) => {
      console.error(`Error fetching NFTs for wallet address ${walletAddress}`)
      result = error
    })

  return result
}

const getTokensByWalletAddress = async (walletAddress) => {
  let nfts = null
  const secretType = 'MATIC'
  await axios
    .get(
      `https://matic-azrael-staging.arkane.network/${walletAddress}/tokens`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then((response) => {
      if (response.data.length > 0) {
        let allTokens = []
        response.data.map((smartContract) => {
          allTokens = allTokens.concat(smartContract.tokens)
        })

        nfts = allTokens
      }
    })
    .catch((error) => console.log('error', error))
  return nfts
}

const createOfferSale = async (data) => {
  let token = await getVelyAuthToken()
  let result = null

  var raw = JSON.stringify({
    type: 'SALE',
    nft: {
      tokenId: data.tokenId,
      address: data.address,
      chain: 'MATIC'
    },
    sellerAddress: data.sellerAddress,
    price: data.price
  })

  await axios
    .post(`${process.env.MARKET_API_ENDPOINT}/offers`, raw, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      result = response.data
    })
    .catch((error) => console.log('error', error))

  return result
}

const getPrepareTransaction = async (id) => {
  let token = await getVelyAuthToken()
  let result = null

  await axios
    .get(
      `${process.env.MARKET_API_ENDPOINT}/offers/${id}/preparation/transactions`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      result = response.data
    })
    .catch((error) => console.log('error', error))

  return result
}

const addOfferTxApprove = async (data) => {
  let token = await getVelyAuthToken()
  let result = null

  var raw = JSON.stringify({
    txApprove: data.transactionHash
  })

  await axios
    .patch(
      `https://api-staging.arkane.market/offers/${data.offerId}/txapprove`,
      raw,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      result = response.data
    })
    .catch((error) => console.log('error', error))

  return result
}

const addOfferSignature = async (data) => {
  let token = await getVelyAuthToken()
  let result = null

  var raw = JSON.stringify({
    signature: data.dataToSign
  })

  await axios
    .patch(
      `${process.env.MARKET_API_ENDPOINT}/offers/${data.offerId}/signature`,
      raw,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      result = response.data
      console.log(
        'offerSignature accepted; item is being listed =>',
        response.data
      )
    })
    .catch((error) => console.log('error', error))

  return result
}

const buyOffer = async (data) => {
  let token = await getVelyAuthToken()
  var raw = JSON.stringify({
    externalUserId: data.username,
    walletAddress: data.walletAddress
  })

  const promise = axios
    .post(
      `${process.env.MARKET_API_ENDPOINT}/offers/${data.offerId}/buy`,
      raw,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      console.log('successfully invoked buyOffer =>', response.data)
      return response.data
    })
    .catch((error) => {
      console.log('error', error)
      const errors = error.response.data.errors.map((error) => error.code)
      return {
        success: false,
        errors
      }
    })

  return promise
}

const editOffer = async (data) => {
  let token = await getVelyAuthToken()
  var raw = JSON.stringify({
    price: data.price
  })

  const promise = axios
    .patch(
      `${process.env.MARKET_API_ENDPOINT}/offers/${data.offerId}/price`,
      raw,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      console.log('successfully invoked edit Offer =>', response.data)
      return response.data
    })
    .catch((error) => {
      console.log('error', error)
      const errors = error.response.data.errors.map((error) => error.code)
      return {
        success: false,
        errors
      }
    })

  return promise
}

const cancelOffer = async (data) => {
  let token = await getVelyAuthToken()

  const promise = axios
    .post(
      `${process.env.MARKET_API_ENDPOINT}/offers/${data.offerId}/cancel`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      console.log('successfully invoked cancel Offer =>', response.data)
      return response.data
    })
    .catch((error) => {
      console.log('error', error)
      const errors = error.response.data.errors.map((error) => error.code)
      return {
        success: false,
        errors
      }
    })

  return promise
}

const getOffer = async (offerId) => {
  let token = await getVelyAuthToken()

  return axios
    .get(
      `${process.env.MARKET_API_ENDPOINT}/offers/${offerId}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => response.data)
    .catch((error) => {
      return {
        success: false,
        error
      }
    })

  return promise
}

const getNFTsByStatus = async (status) => {
  let nfts = null
  let token = await getVelyAuthToken()
  await axios
    .get(
      `${process.env.MARKET_API_ENDPOINT}/offers?contractAddress=${process.env.VENLY_CONTRACT_ADDRESS}&status=${status}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      if (response.data) {
        nfts = response.data.result
      }
    })
    .catch((error) => console.log('error', error))
  return nfts
}

const retrieveNftMetadataByAddressAndId = async (contractAddress, tokenId) => {
  let nft = null
  let token = await getVelyAuthToken()
  let uri = `${process.env.VENLY_API}/contracts/${contractAddress}/tokens/${tokenId}`
  await axios
    .get(uri, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      if (response.data) {
        nft = response.data
        nft.metadata = JSON.parse(nft.metadata)
      }
    })
    .catch((error) => {
      console.log('error', error)
    })

  return nft
}

const retrieveNftMetadata = async (id) => {
  let nft = null
  let token = await getVelyAuthToken()

  await axios
    .get(
      `${process.env.NFT_API_ENDPOINT}/${process.env.VENLY_APP_ID}/contracts/${process.env.VENLY_CONTRACT_ID}/token-types/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    .then((response) => {
      if (response.data) {
        nft = response.data
      }
    })
    .catch((error) => console.log('error', error))
  return nft
}

module.exports.getAllNFTsForWalletAddress = getAllNFTsForWalletAddress
module.exports.getVelyAuthToken = getVelyAuthToken
module.exports.createTokenType = createTokenType
module.exports.createToken = createToken
module.exports.getTokensByWalletAddress = getTokensByWalletAddress
module.exports.createOfferSale = createOfferSale
module.exports.getPrepareTransaction = getPrepareTransaction
module.exports.addOfferTxApprove = addOfferTxApprove
module.exports.addOfferSignature = addOfferSignature
module.exports.buyOffer = buyOffer
module.exports.editOffer = editOffer
module.exports.cancelOffer = cancelOffer
module.exports.getOffer = getOffer
module.exports.getNFTsByStatus = getNFTsByStatus
module.exports.retrieveNftMetadata = retrieveNftMetadata
module.exports.retrieveNftMetadataByAddressAndId =
  retrieveNftMetadataByAddressAndId
module.exports.editMetadata = editMetadata
module.exports.createCollection = createCollection
module.exports.getCollectionAddress = getCollectionAddress
