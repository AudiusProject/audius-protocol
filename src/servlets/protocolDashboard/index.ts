import express from 'express'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import unzipper from 'unzipper'
// @ts-ignore
import ipfs, { globSource } from '../../ipfs'
import libs from '../../libs'

export const router = express.Router()
const BUILD_URL = process.env.PROTOCOL_DASHBOARD_BUILD_URL

// Peers with all content nodes
router.get('/content_nodes', async (
  req: express.Request,
  res: express.Response) => {
  try {
    const contentNodes = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList('content-node')
    res.json(contentNodes)
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
