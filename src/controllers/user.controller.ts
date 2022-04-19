import bcrypt from 'bcrypt'
import { uploadFile, getUrl } from '../utils'

const achievement = require('../achievement')

// REFACTOR this
import db from '../models'
const User = db.users

// Create and Save a new User
export const create = async (req: any, res: any) => {
  try {
    let salt = await bcrypt.genSalt(10)
    let hash = await bcrypt.hash(req.body.password, salt)
    let user = new User({
      username: req.body.userName,
      password: hash,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      usernameOrEmail: req.body.email,
      role: req.body.role ? req.body.role : 0,
      createdAt: new Date(),
      googleId: ''
    })

    if (req.body.googleId) {
      let newUser = await User.findOne({ googleId: req.body.googleId })
      if (newUser) {
        //If user present in our database.
        res.status(200).json({
          message: 'Already registered!',
          data: newUser
        })
      } else {
        // if user is not preset in our database save user data to database.
        user.googleId = req.body.googleId
      }
    }

    let registeredUser = await user.save()
    res.status(200).json({
      message: 'User ' + req.body.userName + ' was successfully created!',
      data: registeredUser
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

// Retrieve all Users from the database.
export const findAll = (req: any, res: any) => {}
// Find a single User with an id
export const findOne = async (req: any, res: any) => {
  try {
    let user = await User.findById(req.body.id)
    res.status(200).json({
      data: user
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}
// Update a User by the id in the request
export const update = (req: any, res: any) => {}
// Delete a User with the specified id in the request
export const deleteOne = (req: any, res: any) => {}
// Delete all Tutorials from the database.
export const deleteAll = (req: any, res: any) => {}

//Update user avatar
export const updateAvatar = async (req: any, res: any) => {
  try {
    /***
     * Achievement Code .. For First Time Avatar..
     **/
    let achievements = []
    let respFirst = await achievement.firstAvatarAchievement(req.user._id)
    if (respFirst !== false && respFirst.status === true) {
      achievements.push(respFirst.data as never)
    }
    // user profile achievement
    let respProfile = await achievement.userProfileAchievement(req.user._id)
    if (respProfile !== false && respProfile.status === true) {
      achievements.push(respProfile.data as never)
    }
    console.log(achievements)

    const result = await uploadFile(req.files.avatar)
    const url = await getUrl(req.files.avatar)

    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: req.files.avatar.name
      },
      { new: true }
    )

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.firstName + ' ' + updatedUser.lastName,
        usernameOrEmail: updatedUser.email,
        role: updatedUser.role,
        avatar: url
      }
    })
  } catch (error) {
    res.status(400).json({
      type: 'Upload Server Error',
      success: false,
      message: 'Server Error'
    })
  }
}
//Remove Avatar
export const removeAvatar = async (req: any, res: any) => {
  try {
    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: ''
      },
      { new: true }
    )

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.firstName + ' ' + updatedUser.lastName,
        usernameOrEmail: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    })
  } catch (err) {
    res.status(400).send(err)
  }
}

//Update Email
export const updateEmail = async (req: any, res: any) => {
  try {
    const email = await req.body.email

    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        email: email
      },
      { new: true }
    )

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.firstName + ' ' + updatedUser.lastName,
        usernameOrEmail: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    })
  } catch (err) {
    res.status(400).send(err)
  }
}

//Update Password
export const updatePassword = async (req: any, res: any) => {
  try {
    let salt = await bcrypt.genSalt(10)
    let hash = await bcrypt.hash(req.body.password, salt)

    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        password: hash
      },
      { new: true }
    )

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.firstName + ' ' + updatedUser.lastName,
        usernameOrEmail: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    })
  } catch (err) {
    res.status(400).send(err)
  }
}

//Update Profile
export const updateProfile = async (req: any, res: any) => {
  try {
    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        // usernameOrEmail: req.body.userName,
        bio: req.body.bio
      },
      { new: true }
    )

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.firstName + ' ' + updatedUser.lastName,
        username: updatedUser.username,
        usernameOrEmail: updatedUser.usernameOrEmail,
        bio: updatedUser.bio,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    })
  } catch (err) {
    res.status(400).send(err)
  }
}

//Update user banner
export const updateBanner = async (req: any, res: any) => {
  try {
    const result = await uploadFile(req.files.banner)
    const url = await getUrl(req.files.banner)

    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        banner: req.files.banner.name
      },
      { new: true }
    )

    if (updatedUser) {
      res.status(200).json({
        success: true,
        banner: url
      })
    } else {
      res.status(400).json({
        type: 'Authentication Failed',
        success: false,
        message: ' please login first'
      })
    }
  } catch (error) {}
}

//Update user wallet addresses
export const updateWalletAddresses = async (req: any, res: any) => {
  try {
    let user = await User.findById(req.user._id)
    let walletAddresses = user.walletAddresses
    if (!walletAddresses.includes(req.body.walletAddress)) {
      walletAddresses.push(req.body.walletAddress)
    }
    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        walletAddresses: walletAddresses
      },
      { new: true }
    )
    if (updatedUser) {
      res.status(200).json({
        success: true,
        walletAddresses: walletAddresses
      })
    } else {
      res.status(400).json({
        type: 'Authentication Failed',
        success: false,
        message: ' please login first'
      })
    }
  } catch (error) {
    console.log(error)
  }
}

//Delete user wallet addresses
export const deleteWalletAddresses = async (req: any, res: any) => {
  try {
    let user = await User.findById(req.user._id)
    let walletAddresses = user.walletAddresses
    if (walletAddresses.includes(req.body.walletAddress)) {
      const index = walletAddresses.indexOf(req.body.walletAddress, 0)
      if (index > -1) {
        walletAddresses.splice(index, 1)
      }
    }
    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        walletAddresses: walletAddresses
      },
      { new: true }
    )
    if (updatedUser) {
      res.status(200).json({
        success: true,
        walletAddresses: walletAddresses
      })
    } else {
      res.status(400).json({
        type: 'Authentication Failed',
        success: false,
        message: ' please login first'
      })
    }
  } catch (error) {
    console.log(error)
  }
}

//Update user's linked wallet addresses
export const updateLinkedWalletAddresses = async (req: any, res: any) => {
  try {
    let user = await User.findById(req.user._id)
    let linkedWalletAddresses = user.linkedWalletAddresses
    if (!linkedWalletAddresses.includes(req.body.walletAddress)) {
      linkedWalletAddresses.push(req.body.walletAddress)
    }
    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        linkedWalletAddresses: linkedWalletAddresses
      },
      { new: true }
    )

    // user profile achievement
    let respProfile = await achievement.userProfileAchievement(req.user._id)
    console.log(respProfile, '==> respProfileAchieve')

    if (updatedUser) {
      res.status(200).json({
        success: true,
        linkedWalletAddresses: linkedWalletAddresses
      })
    } else {
      res.status(400).json({
        type: 'Authentication Failed',
        success: false,
        message: ' please login first'
      })
    }
  } catch (error) {
    console.log(error)
  }
}

//Delete user's linked wallet addresses
export const deleteLinkedWalletAddresses = async (req: any, res: any) => {
  try {
    let user = await User.findById(req.user._id)
    let linkedWalletAddresses = user.linkedWalletAddresses
    if (linkedWalletAddresses.includes(req.body.walletAddress)) {
      const index = linkedWalletAddresses.indexOf(req.body.walletAddress, 0)
      if (index > -1) {
        linkedWalletAddresses.splice(index, 1)
      }
    }
    let updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        linkedWalletAddresses: linkedWalletAddresses
      },
      { new: true }
    )
    if (updatedUser) {
      // user profile achievement
      let respProfile = await achievement.userProfileAchievement(req.user._id)
      console.log(respProfile, '==> respProfileAchieve')

      res.status(200).json({
        success: true,
        linkedWalletAddresses: linkedWalletAddresses
      })
    } else {
      res.status(400).json({
        type: 'Authentication Failed',
        success: false,
        message: ' please login first'
      })
    }
  } catch (error) {
    console.log(error)
  }
}
