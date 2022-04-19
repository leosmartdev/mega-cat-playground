import mongoose from 'mongoose'
import { testDbConnection } from '.'

export const connectToMongoose = async (stagingDevelopmentUrl: string) => {
  await mongoose.connect(stagingDevelopmentUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  })

  console.log('Connected to the DB!')
  await testDbConnection()
}
