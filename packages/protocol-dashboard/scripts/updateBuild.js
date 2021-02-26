const fs = require('fs')
const fetch = require('node-fetch')

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

const updateContentNodePeers = async () => {
  const res = await fetch(`${endpoint}/protocol_dashboard/peer_content_nodes`)
  const response = await res.json()
  console.log({ response })
  if (!response.success) {
    console.error('unable to update content node ipfs peers')
    process.exit(1)
  }
  console.log('Added ipfs peers')
}

const updateGABuild = async () => {
  const res = await fetch(`${endpoint}/protocol_dashboard/update_build`)
  const response = await res.json()
  if (!response.success) {
    console.error('unable to update GA build')
    process.exit(1)
  }
  console.log('Updated build folder in GA')
}

const pinGABuild = async () => {
  const res = await fetch(`${endpoint}/protocol_dashboard/pin_build`)
  if (!res.ok) {
    console.error('unable to pin GA build')
    process.exit(1)
  }
  const response = await res.json()
  const cid = response.cid
  console.log(`IPFS Pin Added CID: ${cid}`)
  return cid
}

const run = async () => {
  try {
    await updateContentNodePeers()
    await updateGABuild()
    const cid = await pinGABuild()
    fs.writeFileSync(`./build_cid.txt`, cid)
    process.exit()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

run()