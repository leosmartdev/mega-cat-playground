const axios = require('axios')
const circleApiUrl = process.env.CIRCLE_API
const platformCustodialWalletID = process.env.PCW_ID
const platformReserveWalletID = process.env.PRW_ID
const { v1: uuidv1, v4: uuidv4 } = require('uuid')
const token =
  'QVBJX0tFWTo5MDBmNDIwZmVmNTUwMDAzY2ZiM2E0ZTlmZmQxMDkwNDpkZWRiZTI5NDE5MTNiMGY1ODAxNjc2NjJiOWVjNjBiMg'

async function createTransfer(sellerAddress, amount) {
  if (!sellerAddress || !amount) {
    return false
  }

  let success = false
  const url = `${circleApiUrl}/v1/transfers`
  const data = {
    source: {
      type: 'wallet',
      id: merchantWalletID
    },
    destination: {
      type: 'blockchain',
      chain: 'ETH',
      address: platformCustodialWalletID
    },
    amount: {
      currency: 'USD',
      amount: amount.toString()
    },
    idempotencyKey: uuidv4()
  }
  await axios
    .post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log('transfer created successfuly', response.data)
      success = true
    })
    .catch((error) => {
      console.log('error', error)
      success = false
    })
}

async function createCircleWallet() {
  let result = null
  const url = `${circleApiUrl}/v1/wallets`
  const data = {
    idempotencyKey: uuidv4()
  }
  await axios
    .post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log('Wallet created successfuly', response.data)
      result = response.data
    })
    .catch((error) => {
      console.log('error', error)
      success = false
    })
  return result
}

async function createTransferToMerchantCircleWallet(payout) {
  if (!payout.sellerCircleWalletID || !payout.payoutAmount) {
    return false
  }

  let success = false
  const url = `${circleApiUrl}/v1/transfers`
  const data = {
    source: {
      type: 'wallet',
      id: platformCustodialWalletID
    },
    destination: {
      type: 'wallet',
      id: payout.sellerCircleWalletID
    },
    amount: {
      currency: 'USD',
      amount: payout.payoutAmount.toString()
    },
    idempotencyKey: uuidv4()
  }
  await axios
    .post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log('transfer created successfuly', response.data)
      success = true
    })
    .catch((error) => {
      console.log('error', error)
      success = false
    })

  return success
}

async function createTransferToPlatformReserveCircleWallet(payout) {
  if (!payout.sellerCircleWalletID || !payout.payoutAmount) {
    return false
  }

  let success = false

  const url = `${circleApiUrl}/v1/transfers`
  const data = {
    source: {
      type: 'wallet',
      id: platformCustodialWalletID
    },
    destination: {
      type: 'wallet',
      id: platformReserveWalletID
    },
    amount: {
      currency: 'USD',
      amount: payout.platformFee.toString()
    },
    idempotencyKey: uuidv4()
  }
  await axios
    .post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log('transfer created successfuly', response.data)
      success = true
    })
    .catch((error) => {
      console.log('error', error)
      success = false
    })

  return success
}

async function getUserCircleBalance(walletId) {
  let result = null
  const url = `${circleApiUrl}/v1/wallets/${walletId}`
  await axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log('Wallet fetched successfuly', response.data.data.balances[0])
      result = response.data.data.balances[0].amount
    })
    .catch((error) => {
      console.log('error', error)
    })
  return result
}

async function createTransferToMerchantWallet(
  circleWallet,
  sellerAddress,
  amount
) {
  if (!circleWallet || !sellerAddress || !amount) {
    return false
  }

  let success = false
  const url = `${circleApiUrl}/v1/transfers`
  const data = {
    source: {
      type: 'wallet',
      id: circleWallet
    },
    destination: {
      type: 'blockchain',
      chain: 'ETH',
      address: sellerAddress
    },
    amount: {
      currency: 'USD',
      amount: amount.toString()
    },
    idempotencyKey: uuidv4()
  }
  await axios
    .post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log(
        'Transfer to merchant wallet created successfuly',
        response.data
      )
      success = true
    })
    .catch((error) => {
      console.log('error', error)
      success = false
    })
}

async function getPCIPublicKey() {
  let data = null
  const url = `${circleApiUrl}/v1/encryption/public`

  await axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      data = response.data.data
    })
    .catch((error) => {
      console.log('error', error)
    })
  return data
}

async function processPayment(data) {
  let result = null
  const url = `${circleApiUrl}/v1/payments`

  await axios
    .post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      result = response.data
    })
    .catch((error) => {
      console.log('error', error)
    })
  return result
}

async function createCard(data) {
  console.log('data', data)
  let result = null
  const url = `${circleApiUrl}/v1/cards`

  await axios
    .post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log('responseeeee', response)
      result = response.data
    })
    .catch((error) => {
      console.log('error', error)
    })
  return result
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  )
}

module.exports = {
  createTransfer,
  createCircleWallet,
  createTransferToMerchantCircleWallet,
  createTransferToPlatformReserveCircleWallet,
  getUserCircleBalance,
  createTransferToMerchantWallet,
  getPCIPublicKey,
  processPayment,
  createCard
}
