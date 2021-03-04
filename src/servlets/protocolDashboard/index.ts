import express from 'express'
import fs from 'fs'
import fetch from 'node-fetch'
import AbortController from 'abort-controller'
import path from 'path'
import unzipper from 'unzipper'
// @ts-ignore
import ipfs, { globSource } from '../../ipfs'
import libs from '../../libs'

export const router = express.Router()
const BUILD_URL = process.env.PROTOCOL_DASHBOARD_BUILD_URL
const PEER_IPFS_TIMEOUT = 1000 /* ms */ * 60 /* sec */ * 10 /* min */
const CONTENT_NODE_PEER_TIMEOUT = 1000 /* ms */ * 30 /* sec */

// Peers with all content nodes
router.get('/peer_content_nodes', async (
  req: express.Request,
  res: express.Response) => {
  try {
    res.setTimeout(PEER_IPFS_TIMEOUT, () => {
      res.status(500).send(`Endpoint timeout hit: ${PEER_IPFS_TIMEOUT}ms`)
    })
    // first get my own ipfs id
    const ipfsId = await ipfs.id()

    const addresses = ipfsId.addresses.filter(
      (addr: string) => {
        return !addr.toString().startsWith('/ip4/127.0.0.1') && !addr.toString().startsWith('/ip4/192.168')
      }
    )
    if (addresses.length === 0) {
      res.status(500).send('No Valid IPFS addresses to peer with content nodes')
      return
    }
    const addr = addresses[0]
    const contentNodes = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList('content-node')
    const connections: { [name: string]: boolean } = {}
    for (let cn of contentNodes) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), CONTENT_NODE_PEER_TIMEOUT)
      try {
        // make a req to each CN /ipfs_peer_info with url query caller_ipfs_id
        const response = await fetch(`${cn.endpoint}/ipfs_peer_info?caller_ipfs_id=${encodeURIComponent(addr)}`, {signal: controller.signal})
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
      res.status(500).send(`Unable to connect to any content nodes`)
    } else {
      res.json({ success: true, ipfsAddress: addr, connections })
    }
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// Gets the ipfs id
router.get('/ipfs', async (
  req: express.Request,
  res: express.Response) => {
  try {
    const ipfsId = await ipfs.id()
    res.json(ipfsId)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

const BUILD_ZIP_PATH = path.resolve(__dirname, '../../build.zip')
const BUILD_PATH_EXTRACT = path.resolve(__dirname, '../../')
const BUILD_PATH = path.resolve(__dirname, '../../build')

// Fetches the protocol dashboard build folder
router.get('/update_build', async (
  req: express.Request,
  res: express.Response) => {
  try {
    if (!BUILD_URL) {
      res.status(500).send(`Build URL not specified`)
      return
    }
    const response = await fetch(BUILD_URL)
    await new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(BUILD_ZIP_PATH)
      response.body.pipe(fileStream)
      response.body.on('error', (err: Error) => reject(err))
      fileStream.on('finish', () => resolve(true))
    })

    await new Promise((resolve, reject) => {
      const unzipStream = fs.createReadStream(BUILD_ZIP_PATH)
      unzipStream.on('close', () => resolve(true))
      unzipStream.on('error', reject)
      unzipStream.pipe(unzipper.Extract({ path: BUILD_PATH_EXTRACT }))
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// Pin adds the protocol dashboard build folder to ipfs
router.get('/pin_build', async (
  req: express.Request,
  res: express.Response) => {
  try {
    let files = []
    for await (const file of ipfs.add(globSource(BUILD_PATH, { recursive: true }), { pin: true })) {
      files.push(file)
    }
    const rootFile = files.find((f) => f.path === 'build')
    res.json({ cid: rootFile.cid.toString() })
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})
