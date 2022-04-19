import path from 'path'
import express from 'express'
import fileUpload from 'express-fileupload'
import { loadEnvVariables } from './utils/loadEnvVariables'
import mcache from 'memory-cache'

// ###########################################
//        Environment configuration         //
// - must come before any application imports
// ###########################################
const options = loadEnvVariables()

import router from './routes'
import { startServices } from './utils/startup'

const app = express()

app.use(function (req: any, res: any, next: any) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'X-API-TOKEN, Content-Type, Authorization, Content-Length, X-Requested-With'
  )
  if ('OPTIONS' == req.method) {
    res.sendStatus(200)
  } else {
    next()
  }
})
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(fileUpload())

app.use(express.static(path.join(__dirname, '../public')))

//Routes
app.use('/', router)

export default startServices(options).then(() => app)
