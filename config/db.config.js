module.exports = {
  url: `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_URL}/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`,
  bkcnStagingUrl: `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@${process.env.DATABASE_URL}/?serverSelectionTimeoutMS=2000`,
  bkcnProductionUrl: `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_URL}/?retryWrites=true&w=majority`
}
