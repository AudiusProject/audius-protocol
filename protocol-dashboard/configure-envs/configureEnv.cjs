const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
require('dotenv').config()

// TODO: clean up configureLocalEnv.js and combine with this file

if (!process.argv[2] || !process.argv[2] === 'stage' || !process.argv[2] === 'prod') {
  console.error('Please provide desired environment (stage or prod) as an argument.')
  process.exit(1)
}

const ENV = `.env.${process.argv[2]}`
const CONFIGURED_ENV = `.env.${process.argv[2]}.local`

try {
  const parsedEnv = dotenv.config({ path: path.join(__dirname, '..', ENV) })

  if (parsedEnv.error) {
    throw parsedEnv.error
  }

  let envString = Object.entries(parsedEnv.parsed)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const VITE_DASHBOARD_BASE_URL = process.env.DASHBOARD_BASE_URL || '/'
  envString += `\nVITE_DASHBOARD_BASE_URL=${VITE_DASHBOARD_BASE_URL}`

  const configuredEnv = path.join(__dirname, '..', CONFIGURED_ENV)
  fs.writeFile(configuredEnv, envString, err => {
    if (err) {
      console.error(err)
    }
    console.log(`Successfully configured ${CONFIGURED_ENV}`)
  })
} catch (e) {
  console.error(`Could not configure ${process.argv[2]} env:`, e)
}
