const db = require('../models')
const Achivement = db.achivement
const User = db.users
const Joi = require('joi')
require('dotenv').config()
const mongoose = require('mongoose')

exports.create = async (req, res) => {
  try {
    const schema = Joi.object({
      nftid: Joi.string().required(),
      nftname: Joi.string().required(),
      achievementId: Joi.string().required(),
      actionTaken: Joi.string().required(),
      title: Joi.string().required(),
      type: Joi.string().required(),
      point: Joi.number().required(),
      status: Joi.boolean().required(),
      image: Joi.string().required(),
      state: Joi.string().required(),
      userid: Joi.string().required()
    })
    let userid = req.body.userid
    if (!mongoose.Types.ObjectId.isValid(userid)) {
      userid = String((await User.findOne({ googleId: userid }))._id)
    }
    const { error, value } = schema.validate({
      nftid: req.body.nftid,
      nftname: req.body.nftname,
      achievementId: req.body.achievementId,
      actionTaken: req.body.actionTaken,
      title: req.body.title,
      type: req.body.type,
      point: req.body.point,
      status: req.body.status,
      image: req.body.image,
      state: req.body.state,
      userid: userid
    })

    if (error) {
      res.status(421).json({
        error: error
      })
    } else {
      let achivement = new Achivement(value)
      const result = await achivement.save()
      res.status(201).json({
        data: result,
        message: 'Achievement created successfully'
      })
    }
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}

exports.createWithType = async (post) => {
  try {
    const schema = Joi.object({
      nftid: Joi.string().required(),
      nftname: Joi.string().required(),
      achievementId: Joi.string().required(),
      actionTaken: Joi.string().required(),
      title: Joi.string().required(),
      type: Joi.string().required(),
      point: Joi.number().required(),
      status: Joi.boolean().required(),
      image: Joi.string().required(),
      state: Joi.string().required(),
      userid: Joi.string().required()
    })
    let userid = post.userid
    if (!mongoose.Types.ObjectId.isValid(userid)) {
      userid = String((await User.findOne({ googleId: userid }))._id)
    }
    const { error, value } = schema.validate({
      nftid: post.nftid,
      nftname: post.nftname,
      achievementId: post.achievementId,
      actionTaken: post.actionTaken,
      title: post.title,
      type: post.type,
      point: post.point,
      status: post.status,
      image: post.image,
      state: post.state,
      userid: userid
    })
    if (error) {
      return { status: false, error: error }
    } else {
      let achivement = new Achivement(value)
      const result = await achivement.save()
      return {
        status: true,
        data: result,
        message: 'Achievement created successfully'
      }
    }
  } catch (err) {
    return { status: false, error: err }
  }
}

exports.update = async (req, res) => {
  try {
    const schema = Joi.object({
      nftid: Joi.string().required(),
      nftname: Joi.String().required(),
      title: Joi.String().required(),
      type: Joi.String().required(),
      point: Joi.number().required(),
      status: Joi.boolean().required(),
      image: Joi.string().required(),
      state: Joi.string().required()
    })
    const { error, value } = schema.validate({
      nftid: req.body.nftid,
      nftname: req.body.nftname,
      title: req.body.title,
      type: req.body.type,
      point: req.body.point,
      status: req.body.status,
      image: req.body.image,
      state: req.body.state
    })
    if (error) {
      res.status(421).json({
        error: error
      })
    } else {
      const updatedResult = await Achivement.findOneAndUpdate(
        { _id: req.params.id },
        { $set: value },
        { upsert: true, useFindAndModify: true, new: true }
      )
      res.status(201).json({
        data: updatedResult,
        message: 'Achivement Update successfully'
      })
    }
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}

exports.get = async (req, res) => {
  try {
    let achievement = await Achivement.find()
    res.status(200).json({
      data: achievement
    })
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}

function getAchievementPoints(userid, startDate, Enddate) {
  return new Promise(async (resolve, reject) => {
    let resp = await Achivement.aggregate([
      {
        $match: {
          userid: userid,
          createdAt: { $lte: Enddate, $gte: startDate }
        }
      },
      { $group: { _id: null, count: { $sum: '$point' } } }
    ])
    if (resp && resp.length > 0) {
      resolve(resp[0].count)
    }
    resolve(0)
  })
}

exports.user = async (req, res) => {
  let userid = req.body.id
  if (!mongoose.Types.ObjectId.isValid(userid)) {
    userid = String((await User.findOne({ googleId: userid }))._id)
  }
  try {
    let achivement = await Achivement.find({ userid: userid })
    res.status(200).json({
      data: achivement,
      last7dayCount: await getAchievementPoints(
        userid,
        new Date(new Date().setDate(new Date().getDate() - 7)),
        new Date()
      ),
      lastMonthCount: await getAchievementPoints(
        userid,
        new Date(new Date().setDate(new Date().getDate() - 30)),
        new Date()
      )
    })
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}

exports.getByAchieveId = async (req, res) => {
  let userid = req.body.id
  let achieveId = req.params.achieveId
  if (!mongoose.Types.ObjectId.isValid(userid)) {
    userid = String((await User.findOne({ googleId: userid }))._id)
  }
  try {
    let achievement = await Achivement.find({
      userid: userid,
      achievementId: achieveId
    })
    res.status(200).json({
      data: achievement,
      error: false
    })
  } catch (err) {
    res.status(400).json({
      error: err
    })
  }
}
