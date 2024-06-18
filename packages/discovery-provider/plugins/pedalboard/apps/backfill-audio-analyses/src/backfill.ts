import axios from 'axios'
import stringify from 'fast-json-stable-stringify'
import { Semaphore } from 'await-semaphore'
import { Knex } from 'knex'
import { App } from '@pedalboard/basekit'
import { config } from '.'
import { SharedData } from './index'
import {
  storeDbOffset,
  readDbOffset,
  getCachedHealthyContentNodes
} from './redis'

const Web3 = require('web3')
const web3 = new Web3()

// concurrency control
const MAX_CONCURRENT_REQUESTS = 10
const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS)

const REQUEST_TIMEOUT = 5000 // 5s

interface Track {
  track_id: number
  track_cid: string
  audio_upload_id: string | null
  musical_key: string | null
  bpm: number | null
  audio_analysis_error_count: number | null
}

async function generateSignature(data: any, privateKey: string) {
  // sort keys and stringify data
  const dataStr = stringify(data)
  const toSignHash = web3.utils.keccak256(dataStr)
  const signedMessage = await web3.eth.accounts.sign(
    toSignHash,
    privateKey
  )
  return signedMessage.signature
}

async function analyzeAudio(
  contentNodes: string[],
  track: Track
): Promise<void> {
  const audioUploadId = track.audio_upload_id || ""
  const trackCid = track.track_cid
  // only analyze streamable tracks
  if (!trackCid) return
  const isLegacyTrack = !audioUploadId && trackCid.startsWith("Qm")

  const release = await semaphore.acquire() // acquire a semaphore permit

  // allow up to 5 attempts to trigger audio analysis for this track
  for (let i = 0; i < 5; i++) {
    // choose a random content node
    const contentNode = contentNodes[Math.floor(Math.random() * contentNodes.length)]
    try {
      let analysisUrl = `${contentNode}/uploads/${audioUploadId}/analyze`
      let cid = ""
      if (isLegacyTrack) {
        analysisUrl = `${contentNode}/tracks/legacy/${trackCid}/analyze`
        cid = trackCid
      }
      const timestamp = Math.floor(Date.now()) // current timestamp in ms
      const dataToSign = {
        upload_id: audioUploadId,
        cid,
        shouldCache: 1,
        timestamp,
        trackId: track.track_id,
        userId: 0,
      }
      const signature = await generateSignature(dataToSign, config.delegatePrivateKey)
      const signatureEnvelope = {
        data: JSON.stringify(dataToSign),
        signature: signature
      }
      const queryParams = new URLSearchParams({ signature: JSON.stringify(signatureEnvelope) })

      const response = await axios.post(
        `${analysisUrl}?${queryParams.toString()}`,
        null,
        { timeout: REQUEST_TIMEOUT }
      )
      if (response.status == 200) {
        console.log(
          `Successfully triggered audio analysis for track ID ${track.track_id}, track CID ${trackCid}, upload ID ${audioUploadId} via ${contentNode}`
        )
        break
      } else {
        console.log(
          `Error triggering audio analysis on ${contentNode}: Received ${response.status} response. Attempt #${i+1} to trigger audio analysis for track ID ${track.track_id}, track CID ${trackCid}, upload ID ${audioUploadId}. Trying another content node...`
        )
        continue
      }
    } catch (error: any) {
      if (error.isAxiosError !== undefined && error.code === 'ECONNABORTED') {
        // timeout
        console.log(
          `Timeout error triggering audio analysis on ${contentNode}: ${error.message}. Attempt #${i+1} to trigger audio analysis for track ID ${track.track_id}, track CID ${trackCid}, upload ID ${audioUploadId}. Trying another content node...`
        )
      } else {
        console.error(
          `Error triggering audio analysis for track ID ${track.track_id}, track CID ${trackCid}, upload ID ${
            audioUploadId
          }: ${(error as Error).message}. Trying another content node...`
        )
      }
      continue
    }
  }

  release() // release the semaphore permit
}

async function fetchTracks(
  offset: number,
  limit: number,
  db: Knex
): Promise<Track[]> {
  return await db<Track>('tracks')
    .where(function () {
      this.whereNull('musical_key').orWhereNull('bpm')
    })
    .andWhere('audio_analysis_error_count', 0)
    .orderBy('track_id', 'asc')
    .offset(offset)
    .limit(limit)
}

// trigger audio analyses for batchSize tracks at a time
async function processBatches(db: any, batchSize: number): Promise<void> {
  let offset
  while (true) {
    console.time('Batch processing time')
    const contentNodes = await getCachedHealthyContentNodes()
    if (contentNodes.length == 0) {
      console.timeEnd('Batch processing time')
      console.error(`No healthy content nodes found. Please investigate`)
      return
    }
    offset = await readDbOffset()
    if (offset == null) {
      offset = 0
    }
    const tracks = await fetchTracks(offset, batchSize, db)
    if (tracks.length === 0) {
      console.timeEnd('Batch processing time')
      break
    }
    const analyzePromises = tracks.map((track) =>
      analyzeAudio(contentNodes.map((node) => node.endpoint), track)
    )
    await Promise.all(analyzePromises)

    offset += batchSize
    await storeDbOffset(offset)
    console.timeEnd('Batch processing time')
    console.log(
      `Triggered audio analyses for ${tracks.length} tracks. New offset: ${offset}`
    )

    if (config.testRun) {
      console.log(
        `[TEST RUN] Triggered audio analyses for the following track IDs: ${tracks.map(
          (track) => track.track_id
        )}`
      )
      // only do 1 batch in a test run
      break
    }

    // sleep for 30 seconds
    await new Promise((resolve) => setTimeout(resolve, 30000))
  }
}

export const backfill = async (app: App<SharedData>) => {
  const db = app.getDnDb()
  const BACKFILL_BATCH_SIZE = config.testRun ? 100 : 1000
  await processBatches(db, BACKFILL_BATCH_SIZE)

  console.log('No more tracks to backfill. Goodbye!')
}
