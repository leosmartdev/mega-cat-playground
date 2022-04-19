import mongoose from 'mongoose'

export const testDbConnection = async () => {
  const names = await mongoose.connection.db.listCollections().toArray()
  console.log('displaying collections from mongodb database')
  // console.log(names) // [{ name: 'dbname.myCollection' }]
}
