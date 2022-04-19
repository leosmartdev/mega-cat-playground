import { AddressInfo } from 'net'
import mongoose = require('mongoose')
const db = require('../models')
const Drop = require('../models/drop.model')
const Whitelist = require('../models/whitelist.model')
const _ = require('lodash')
const path = require('path')
const { google } = require('googleapis')
const sheets = google.sheets('v4')

const keyFilename = path.join(
  __dirname,
  '../../keys/mega-cat-labs-marketplace-316c0c3fa5bd.json'
)

const DEFAULT_EXPIRY_MINUTES = 30

async function fetchWhitelistForDrop(req, res, next) {
  const dropId = req.params.id
  const expiryMinutes = req.query.expiryMinutes ?? DEFAULT_EXPIRY_MINUTES

  let dbWhitelist = await Whitelist.findOne({
    drop: mongoose.Types.ObjectId(dropId)
  }).populate('drop')

  if (!dbWhitelist) {
    res.status(400).json({
      error: true,
      message: `Whitelist not found for drop ${dropId}`
    })
    return
  }

  const lastUpdate = dbWhitelist.updatedAt
  const expiry = new Date(lastUpdate)
  expiry.setMinutes(expiry.getMinutes() + parseInt(expiryMinutes, 10))

  const now = new Date()
  if (now.getTime() >= expiry.getTime()) {
    const drop = dbWhitelist.drop
    const whitelistId = drop.whitelist
    console.log(
      `Fetching updates for drop ${dropId} and whitelistId ${whitelistId}`
    )
    try {
      const { headers, whitelist, googlesheet } = await fetchWhitelistPayload(
        whitelistId
      )
      console.log(`Whitelist addresses found ${whitelist.length}`)
      dbWhitelist.addresses = whitelist
      dbWhitelist.headers = headers
      dbWhitelist.googlesheet = googlesheet

      console.log('Saving whitelist')
      const updatedWhitelist = await dbWhitelist.save()
      dbWhitelist = updatedWhitelist
      console.log('Whitelist saved', dbWhitelist)
    } catch (error) {
      console.log('Error fetching whitelist', error)
    }
  }

  const payload = {
    headers: dbWhitelist.headers,
    whitelist: dbWhitelist.addresses
  }

  res.status(200).json(payload)
}

async function create(req: any, res: any) {
  let whitelist = req.body
  console.log('Trying to create whitelist', whitelist)

  whitelist.drop = new mongoose.Types.ObjectId(whitelist.drop)
  let dbWhitelist = new Whitelist(whitelist)

  let existingWhitelist = await Whitelist.findOne({
    drop: mongoose.Types.ObjectId(whitelist.drop)
  }).populate('drop')

  if (existingWhitelist) {
    res.status(403).json({
      error: true,
      message: `Whitelist already exists for drop ${whitelist.drop}`
    })
    return
  }

  console.log('Successfully created whitelist', dbWhitelist)
  const saved = await dbWhitelist.save()
  console.log('Saved whitelist', saved)
  res.status(200).json(saved)
}

async function fetchWhitelist(req, res, next) {
  const spreadsheetId =
    req.params.id ?? '1r1ooRAPwDzf7wP80az5v6-iHs57XvnnlXwhofxlIMCk'

  const auth = new google.auth.GoogleAuth({
    keyFilename: keyFilename,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/spreadsheets.readonly'
    ]
  })

  // Acquire an auth client, and bind it to all future calls
  const authClient = await auth.getClient()
  google.options({ auth: authClient })

  // Do the magic
  try {
    const response = await sheets.spreadsheets.get({
      includeGridData: true,
      // The ranges to retrieve from the spreadsheet.
      //ranges: '*',
      spreadsheetId: spreadsheetId
    })

    const currentSheet = response.data.sheets.filter((sheet) => {
      return sheet.properties.title === 'LIVE ON SITE'
    })[0]

    const sheetData = currentSheet.data[0]
    let headers = extractHeaders(sheetData)
    let whitelist = extractWhitelist(sheetData)

    const payload = {
      headers,
      whitelist
    }

    res.status(200).json(payload)
  } catch (error) {
    const myError: any = error
    res.status(502).json({
      error: myError,
      message:
        myError.message ??
        'The following email needs access to your spreadsheet. "mcl-marketplace-sheets-staging@mega-cat-labs-marketplace.iam.gserviceaccount.com"'
    })
  }
}

async function fetchWhitelistPayload(dropId: string) {
  const spreadsheetId = dropId

  const auth = new google.auth.GoogleAuth({
    keyFilename: keyFilename,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/spreadsheets.readonly'
    ]
  })

  const authClient = await auth.getClient()
  google.options({ auth: authClient })

  const response = await sheets.spreadsheets.get({
    includeGridData: true,
    // The ranges to retrieve from the spreadsheet.
    //ranges: '*',
    spreadsheetId: spreadsheetId
  })

  const currentSheet = response.data.sheets.filter((sheet) => {
    return sheet.properties.title === 'LIVE ON SITE'
  })[0]

  const sheetData = currentSheet.data[0]
  let headers = extractHeaders(sheetData)
  let whitelist = extractWhitelist(sheetData)

  const payload = {
    headers,
    whitelist,
    googlesheet: response.data
  }

  return payload
}

function extractHeaders(sheetData) {
  const rowData = sheetData.rowData
  const populatedRows = rowData.length

  if (populatedRows == 0) {
    return []
  }

  const headerRows = rowData[0].values.filter((value) => {
    return value.formattedValue
  })

  const headers = headerRows.map((value) => {
    return value.formattedValue
  })

  return headers
}

function extractWhitelist(sheetData) {
  const rowData = sheetData.rowData
  const addresses = rowData.map((row) => {
    let address
    try {
      address = row.values[0].formattedValue
    } catch (error) {
      address = ''
    }

    return address
  })

  return addresses.slice(1) // Remove header.
}

module.exports = {
  fetchWhitelist,
  fetchWhitelistForDrop,
  create
}
