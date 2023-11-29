const fs = require('fs')
const fetch = require('node-fetch')
const pinataSDK = require('@pinata/sdk')

const pinata = pinataSDK(process.env.PINATA_KEY_NAME, process.env.PINATA_KEY_SECRET)

const args = process.argv
console.log(process.argv)
if (args.length < 3) {
  console.error('Need to provide environment <dev|stage|prod>')
  process.exit(1)
} else if (args.length > 3) {
  console.warn('Extra arg provided')
}

const env = args[2]
if (env !== 'dev' && env !== 'stage' && env !== 'prod') {
  console.error('Environment must be <dev|stage|prod>')
  process.exit(1)
}

const config = {
  dev: {
    gaEndpoint: 'http://localhost:9001'
  },
  stage: {
    gaEndpoint: 'https://general-admission.staging.audius.co'
  },
  prod: {
    gaEndpoint: 'https://general-admission.audius.co'
  }
}

const endpoint = config[env].gaEndpoint

const updateGABuild = async () => {
  const res = await fetch(`${endpoint}/ipfs/update_build?site=protocol-dashboard`)
  const response = await res.json()
  if (!response.success) {
    console.error('unable to update GA build')
    process.exit(1)
  }
  console.log('Updated build folder in GA')
}

const pinGABuild = async () => {
  const res = await fetch(`${endpoint}/ipfs/pin_build?site=protocol-dashboard`)
  if (!res.ok) {
    console.error('unable to pin GA build')
    process.exit(1)
  }
  const response = await res.json()
  const cid = response.cid
  console.log(`IPFS Pin Added CID: ${cid}`)
  return cid
}

const pinFromFs = async (cid) => {
  const options = {
    pinataMetadata: {
      name: `Dashboard build ${env} ${cid} - ${new Date().toISOString()}`
    }
  }
  const sourcePath = '/home/circleci/audius-protocol/protocol-dashboard/dist'
  try {
    const result = await pinata.pinFromFS(sourcePath, options)
    console.log(result)
    return result
  } catch (e) {
    console.log(e)
  }
}

const run = async () => {
  try {
    await updateGABuild()
    const cid = await pinGABuild()
    const { IpfsHash } = await pinFromFs(cid)
    fs.writeFileSync(`./build_cid.txt`, IpfsHash)
    process.exit()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

run()
