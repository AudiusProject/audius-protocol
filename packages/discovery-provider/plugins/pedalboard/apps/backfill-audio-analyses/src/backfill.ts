import axios from 'axios'
import _ from 'lodash'
import { ethers } from 'ethers'
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

// Batch size for fetching tracks
const BACKFILL_BATCH_SIZE = config.testRun ? 100 : 1000

// Concurrency control
const MAX_CONCURRENT_REQUESTS = 10
const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS)

const REQUEST_TIMEOUT = 5000 // 5s

interface Track {
  track_id: number
  track_cid: string
  audio_upload_id: string
  musical_key: string | null
  bpm: number | null
  audio_analysis_error_count: number | null
}

function generateSignature(data: any, privateKey: string): string {
  const toSignStr = JSON.stringify(data, Object.keys(data).sort())
  const toSignHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(toSignStr))
  const signingKey = new ethers.utils.SigningKey(privateKey)
  const signature = signingKey.signDigest(toSignHash)
  return ethers.utils.joinSignature(signature)
}

async function analyzeAudio(
  contentNodes: string[],
  track: Track
): Promise<void> {
  const audioUploadId = track.audio_upload_id
  const trackCid = track.track_cid
  // only analyze streamable tracks
  if (!trackCid) return

  const isLegacyTrack = !audioUploadId && trackCid.startsWith("Qm")

  const release = await semaphore.acquire() // Acquire a semaphore permit
  for (let i = 0; i < 5; i++) {
    // Choose a random content node
    const contentNode = contentNodes[Math.floor(Math.random() * contentNodes.length)]
    try {
      console.log(
        `Querying ${contentNode} for audio analysis for track ID ${track.track_id}, track CID ${trackCid}, upload ID ${audioUploadId}`
      )
      let analysisUrl = `${contentNode}/uploads/${audioUploadId}/analyze`
      if (isLegacyTrack) {
        analysisUrl = `${contentNode}/tracks/legacy/${trackCid}/analyze`
      }
      const timestamp = Math.floor(Date.now() / 1000) // current timestamp in seconds
      const dataToSign = {
        trackId: track.track_id,
        timestamp,
        uploadId: audioUploadId
      }
      const signature = generateSignature(dataToSign, config.delegatePrivateKey)
      const queryParams = new URLSearchParams({ signature })
      const response = await axios.post(
        `${analysisUrl}?${queryParams.toString()}`,
        null,
        { timeout: REQUEST_TIMEOUT }
      )
      if (response.status !== 200) {
        console.log(
          `Error triggering audio analysis on ${contentNode}: Received ${response.status} response. Attempt #${i+1} to trigger audio analysis for track ID ${track.track_id}, track CID ${trackCid}, upload ID ${audioUploadId}. Trying another content node...`
        )
        continue
      }
    } catch (error: any) {
      if (error.isAxiosError !== undefined && error.code === 'ECONNABORTED') {
        console.log(
          `Timeout error triggering audio analysis on ${contentNode}: ${error.message}. Attempt #${i+1} to trigger audio analysis for track ID ${track.track_id}, track CID ${trackCid}, upload ID ${audioUploadId}. Trying another content node...`
        )
        continue
      } else {
        console.error(
          `Error triggering audio analysis for track ID ${track.track_id}, track CID ${trackCid}, upload ID ${
            audioUploadId
          }: ${(error as Error).message}. Skipping track...`
        )
        break
      }
    }

    release() // Release the semaphore permit
  }
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

// Trigger audio analyses for BACKFILL_BATCH_SIZE tracks at a time
async function processBatches(db: Knex): Promise<void> {
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
    const tracks = await fetchTracks(offset, BACKFILL_BATCH_SIZE, db)
    if (tracks.length === 0) {
      console.timeEnd('Batch processing time')
      break
    }
    const analyzePromises = tracks.map((track) =>
      analyzeAudio(contentNodes.map((node) => node.endpoint), track)
    )
    await Promise.all(analyzePromises)

    offset += BACKFILL_BATCH_SIZE
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

    // Sleep for 30 seconds
    await new Promise((resolve) => setTimeout(resolve, 30000))
  }

  console.log('No more tracks to backfill. Goodbye!')
  process.exit(0)
}

export const backfill = async (app: App<SharedData>) => {
  const db = app.getDnDb()
  await processBatches(db)
}
