const fs = require('fs')
const fetch = require('node-fetch')
const AbortController = require('abort-controller')

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

const CONTENT_NODE_PEER_TIMEOUT = 1000 /* ms */ * 30 /* sec */

const updateContentNodePeers = async () => {
  const contentNodesRes = await fetch(`${endpoint}/protocol_dashboard/content_nodes`)
  const contentNodes = await contentNodesRes.json()
  const ipfsRes = await fetch(`${endpoint}/protocol_dashboard/ipfs`)
  const ipfsId = await ipfsRes.json()
  const addr = ipfsId.addresses[0]
  const connections = {}
  for (let cn of contentNodes) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CONTENT_NODE_PEER_TIMEOUT)
    try {
      // make a req to each CN /ipfs_peer_info with url query caller_ipfs_id
      const response = await fetch(
        `${cn.endpoint}/ipfs_peer_info?caller_ipfs_id=${encodeURIComponent(addr)}`,
        { signal: controller.signal }
      )
      const responseJson = await response.json()
      if (responseJson.data && responseJson.data.id) {
        connections[cn.endpoint] = true
      } else {
        connections[cn.endpoint] = false
      }
    } catch (error) {
      connections[cn.endpoint] = false
    } finally {
      clearTimeout(timeout)
    }
  }
  if (Object.values(connections).every((isConnected) => !isConnected)) {
    console.error('unable to update peer with a single ipfs content node')
    process.exit(1)
  }
  console.log('Added ipfs peers')
  console.log(JSON.stringify(connections, null, ' '))
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