import db from '../../models'
import { connectToMongoose, establishSSHConnection } from './'

export const startServices = async (options: any) => {
  // NOTE: when exporting app.js as agent for supertest
  // we should exclude connecting to the real database
  if (process.env.NODE_ENV === 'test') return

  // console.log("stagingDevelopmentUrl ",stagingDevelopmentUrl,"bookCoinStagingDevelopmentUrl ",bookCoinStagingDevelopmentUrl)
  const environment = options['environment']
    ? options['environment']
    : 'development'

  switch (environment) {
    case 'bkcn-staging':
      const bookCoinStagingDevelopmentUrl = db.bkcnStagingUrl
      await establishSSHConnection(bookCoinStagingDevelopmentUrl)
      break

    case 'bkcn-production':
      console.log('Connecting to ** BookCoin Production DB **')
      const bookCoinProductionUrl = db.bkcnProductionUrl
      await connectToMongoose(bookCoinProductionUrl)
      break

    default:
      console.log('Connecting to ** MegaCats Development DB **')
      const stagingDevelopmentUrl = db.url
      await connectToMongoose(stagingDevelopmentUrl)
      break
  }
}
