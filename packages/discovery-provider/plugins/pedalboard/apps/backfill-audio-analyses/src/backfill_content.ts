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

const DB_OFFSET_KEY = 'backfill_audio_analyses:offset'

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
  const signedMessage = await web3.eth.accounts.sign(toSignHash, privateKey)
  return signedMessage.signature
}

function formatErrorLog(
  message: string,
  track: Track,
  node: string,
  attemptNo: number
): string {
  let errLog = `Error triggering audio analysis on ${node}: ${message}. Attempt #${attemptNo} to trigger audio analysis for track ID ${track.track_id}, track CID ${track.track_cid}`
  if (track.audio_upload_id) {
    errLog += `, upload ID ${track.audio_upload_id}`
  }
  if (attemptNo < 5) {
    errLog += '. Trying another content node...'
  } else {
    errLog += '. Skipping track...'
  }
  return errLog
}

async function analyzeAudio(
  contentNodes: string[],
  track: Track
): Promise<void> {
  const audioUploadId = track.audio_upload_id || ''
  const trackCid = track.track_cid
  // only analyze streamable tracks
  if (!trackCid) return
  const isLegacyTrack = !audioUploadId

  const release = await semaphore.acquire() // acquire a semaphore permit

  // allow up to 5 attempts to trigger audio analysis for this track
  for (let i = 0; i < 5; i++) {
    // choose a random content node
    const contentNode =
      contentNodes[Math.floor(Math.random() * contentNodes.length)]
    try {
      let analysisUrl = `${contentNode}/uploads/${audioUploadId}/analyze`
      let cid = ''
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
        userId: 0
      }
      const signature = await generateSignature(
        dataToSign,
        config.delegatePrivateKey
      )
      const signatureEnvelope = {
        data: JSON.stringify(dataToSign),
        signature: signature
      }
      const queryParams = new URLSearchParams({
        signature: JSON.stringify(signatureEnvelope)
      })

      const response = await axios.post(
        `${analysisUrl}?${queryParams.toString()}`,
        null,
        { timeout: REQUEST_TIMEOUT }
      )
      if (response.status == 200) {
        console.log(
          `Successfully triggered audio analysis for track ID ${
            track.track_id
          }, track CID ${trackCid}${
            audioUploadId ? `, upload ID: ${audioUploadId}` : ''
          } via ${contentNode}`
        )
        break
      } else {
        console.log(
          formatErrorLog(
            `Received ${response.status} response`,
            track,
            contentNode,
            i + 1
          )
        )
        continue
      }
    } catch (error: any) {
      console.log(formatErrorLog(error.message, track, contentNode, i + 1))
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
    offset = await readDbOffset(DB_OFFSET_KEY)
    if (offset == null) {
      offset = 0
    }
    const tracks = await fetchTracks(offset, batchSize, db)
    if (tracks.length === 0) {
      console.timeEnd('Batch processing time')
      break
    }
    const analyzePromises = tracks.map((track) =>
      analyzeAudio(
        contentNodes.map((node) => node.endpoint),
        track
      )
    )
    await Promise.all(analyzePromises)

    offset += batchSize
    await storeDbOffset(DB_OFFSET_KEY, offset)
    console.timeEnd('Batch processing time')
    console.log(`Processed ${tracks.length} tracks. New offset: ${offset}`)

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

export const backfillContent = async (app: App<SharedData>) => {
  if (!config.delegatePrivateKey) {
    console.error('Missing required delegate private key. Terminating...')
    return
  }
  const db = app.getDnDb()
  const BACKFILL_BATCH_SIZE = config.testRun ? 100 : 1000
  await processBatches(db, BACKFILL_BATCH_SIZE)

  console.log('No more tracks to backfill. Goodbye!')
}
