import path from 'path'
import dotenv from 'dotenv'
import minimist from 'minimist'

export const loadEnvVariables = () => {
  const options = minimist(process.argv)
  const environment = options.environment ?? 'dev'
  const configPath = path.resolve(
    process.cwd(),
    `./src/environments/${environment}.env`
  )

  const config: any = dotenv.config({ path: configPath })

  if (config.error) {
    console.error('Environments were not loaded properly')
  } else {
    console.log(
      `Loading config for ${environment}. Blox API is ${config.parsed.BLOX_API}`
    )
  }

  return options
}
