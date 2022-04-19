const AWS = require('aws-sdk')

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

function uploadFile(file) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.name,
    Body: file.data,
    ContentType: file.mimetype
  }

  return s3.upload(params).promise()
}

async function getUrl(file) {
  try {
    const signedUrlExpireSeconds = 60 * 5000000
    return s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.name,
      Expires: signedUrlExpireSeconds
    })
  } catch (e) {
    console.log(e)
    return null
  }
}

async function getUrlFromKey(file) {
  try {
    const signedUrlExpireSeconds = 60 * 5000000
    return s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file,
      Expires: signedUrlExpireSeconds
    })
  } catch (e) {
    console.log(e)
    return null
  }
}

module.exports = {
  getUrl,
  uploadFile,
  getUrlFromKey
}
