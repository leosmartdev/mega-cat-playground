const db = require('../models')
const User = db.users
const Payout = db.payout
const circleUtils = require('../utils/circleUtils')
exports.setAsAdmin = async (req, res) => {
  try {
    let user = await User.findOne({ username: req.body.userName })
    if (user) {
      user.role = 1
      await user.save()
      return res.status(200).json({ result: 'Succesfully changed role' })
    } else {
      return res.status(400).json({ result: 'Username not found' })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error })
  }
}

exports.setAsUser = async (req, res) => {
  try {
    let user = await User.findOne({ username: req.body.userName })
    if (user) {
      user.role = 0
      await user.save()
      return res.status(200).json({ result: 'Succesfully changed role' })
    } else {
      return res.status(400).json({ result: 'Username not found' })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error })
  }
}

exports.getAllAdmins = async (req, res) => {
  try {
    let users = await User.find({ role: 1 })
    return res.status(200).json({ users: users })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error })
  }
}
exports.getAllUsers = async (req, res) => {
  try {
    let users = await User.find({
      username: { $regex: req.body.userName, $options: 'i' },
      role: 0
    })
    return res.status(200).json({ users: users })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error })
  }
}

exports.getAllPendingPayouts = async (req, res) => {
  try {
    let payouts = await Payout.find({}).populate('order')
    return res.status(200).json({ payouts: payouts })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error })
  }
}

exports.approvePayout = async (req, res) => {
  const payoutId = req.body.id
  if (!payoutId) {
    return res.status(400).json({ message: 'invalid request parameters' })
  }
  try {
    let payout = await Payout.findById(payoutId)
    if (!payout) {
      return res.status(400).json({ message: 'Invalid Payout ID' })
    }

    if (payout.status == 'cleared') {
      return res.status(400).json({ message: 'Payout was already cleared' })
    }

    let success = await circleUtils.createTransferToMerchantCircleWallet(payout)
    let result = await circleUtils.createTransferToPlatformReserveCircleWallet(
      payout
    )

    if (success & result) {
      payout.status = 'cleared'
      await payout.save()
      return res.status(200).json({ message: 'Payout succesfully approved' })
    } else {
      return res.status(400).json({ message: 'Unable to trasnfer funds' })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error })
  }
}

exports.getPayoutsByAddress = async (req, res) => {
  if (!req.body.walletAddress) {
    return res.status(400).json({ error: 'invalid request parameters' })
  }
  try {
    let payouts = await Payout.find({ sellerAddress: req.body.walletAddress })
    return res.status(200).json({ payouts: payouts })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: error })
  }
}

exports.getUserBalanceByCircleWallet = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id })
    let result = await circleUtils.getUserCircleBalance(user.circleWalletId)
    return res.status(200).json({ balance: result })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: error })
  }
}

exports.transferCircleToUserWallet = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id })

    let result = await circleUtils.createTransferToMerchantWallet(
      user.circleWalletId,
      req.body.walletAddress,
      req.body.amount
    )
    return res.status(200).json({ balance: result })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: error })
  }
}

exports.approveAllPayouts = async (req, res) => {
  let atLeastOneFailure = false
  let payouts = JSON.parse(req.body.payouts)

  if (payouts.length < 0) {
    return res.status(400).json({ message: 'Invalid request parameters' })
  }

  try {
    const allPayouts = Promise.all(
      payouts.map(async (item) => {
        console.log('payout id: ', item._id)
        let payout = await Payout.findById(item._id)
        if (!payout) {
          return res.status(400).json({ message: 'Invalid Payout ID' })
        }

        if (payout.status == 'cleared') {
          return res.status(400).json({ message: 'Payout was already cleared' })
        }

        let success = await circleUtils.createTransferToMerchantCircleWallet(
          payout
        )
        let result =
          await circleUtils.createTransferToPlatformReserveCircleWallet(payout)

        if (success & result) {
          payout.status = 'cleared'
          await payout.save()
          return true
        } else {
          return false
        }
      })
    )

    let execPayouts = await allPayouts

    console.log('payout: ', execPayouts)

    execPayouts.forEach((payoutResult) => {
      console.log('payoutResult: ', payoutResult)
      if (!payoutResult) {
        atLeastOneFailure = true
      }
    })

    if (atLeastOneFailure) {
      res.status(400).json({
        message: 'One or more payouts failed.'
      })
    } else {
      res.status(200).json({
        message: 'All payouts approved successfully!'
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error })
  }
}
