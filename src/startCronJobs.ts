import { loadEnvVariables } from './utils/loadEnvVariables'

// ###########################################
//        Environment configuration         //
// - must come before any application imports
// ###########################################
const options = loadEnvVariables()

import { checkAwaitingAuctions, checkOnGoingAuctions } from './cron-jobs'
import socketEmitter from './socketEmitter'
import { startServices } from './utils/startup'

socketEmitter().then(async () => {
  await startServices(options)

  console.log('Starting Cron Jobs!!')

  checkAwaitingAuctions.start()
  checkOnGoingAuctions.start()
})
