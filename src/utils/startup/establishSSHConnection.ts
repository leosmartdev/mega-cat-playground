import fs from 'fs'
import tunnel from 'tunnel-ssh'
import { connectToMongoose } from '.'

export const establishSSHConnection = async (stagingDevelopmentUrl: string) => {
  const fileLocation = './keys/bitnami-aws-483128128486.pem'
  const privateKey = fs.readFileSync(fileLocation)

  const config = {
    username: 'bitnami',
    privateKey: privateKey,
    host: '3.80.133.49',
    port: 22,
    dstHost: '127.0.0.1',
    dstPort: 27017,
    localHost: '127.0.0.1',
    localPort: 27000
  }

  await new Promise<boolean>((resolve, reject) => {
    tunnel(config, function (error: Error, _server: any) {
      if (error) {
        console.log('SSH connection error: ' + error)
        reject(error)
      } else {
        console.log('SSH tunnel established.')
        resolve(true)
      }
    })
  })

  await connectToMongoose(stagingDevelopmentUrl)
}
