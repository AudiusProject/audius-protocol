import express from 'express'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import unzipper from 'unzipper'
// @ts-ignore
import ipfs, { globSource } from '../../ipfs'
import libs from '../../libs'

export const router = express.Router()

type buildType = 'protocol-dashboard' | 'audius'

const BUILD_URLS = {
  'protocol-dashboard': process.env.PROTOCOL_DASHBOARD_BUILD_URL,
  'audius': process.env.AUDIUS_SITE_BUILD_URL
}

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

const makeBuildZipPath = (name: string) =>
  path.resolve(__dirname, `../../${name}.zip`)
const BUILD_PATH_EXTRACT = path.resolve(__dirname, '../../')
const makeBuildPath = (name: string) =>
  path.resolve(__dirname, `../../${name}`)

// Fetches the protocol dashboard build folder
// /update_builds?site=protocolDashboard
router.get('/update_build', async (
  req: express.Request,
  res: express.Response) => {
  const { site }: { site: buildType } = req.query
  try {
    if (!BUILD_URLS) {
      res.status(500).send(`Build URLS not specified`)
      return
    }
    const buildUrl = BUILD_URLS[site]!
    const response = await fetch(buildUrl)
    await new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(makeBuildZipPath(site))
      response.body.pipe(fileStream)
      response.body.on('error', (err: Error) => reject(err))
      fileStream.on('finish', () => resolve(true))
    })

    await new Promise((resolve, reject) => {
      const unzipStream = fs.createReadStream(makeBuildZipPath(site))
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
  const { site }: { site: buildType } = req.query
  const buildUrl = BUILD_URLS[site]!
  const buildFileName = buildUrl.split('/').slice(-1)[0].replace('.zip', '')
  try {
    const files = []
    for await (
      const file of ipfs.add(
        globSource(makeBuildPath(buildFileName), { recursive: true }),
        { pin: true }
      )
    ) {
      files.push(file)
    }
    const rootFile = files.find((f) => f.path === buildFileName)
    res.json({ cid: rootFile.cid.toString() })
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})
