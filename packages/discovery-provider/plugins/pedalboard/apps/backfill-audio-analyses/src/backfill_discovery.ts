import axios from 'axios'
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

// concurrency control
const MAX_CONCURRENT_REQUESTS = 10
const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS)

const REQUEST_TIMEOUT = 5000 // 5s

const DB_OFFSET_KEY = 'discovery:backfill_audio_analyses:offset'

interface Track {
  track_id: number
  track_cid: string
  audio_upload_id: string | null
  musical_key: string | null
  bpm: number | null
  audio_analysis_error_count: number | null
}

function formatErrorLog(
  message: string,
  track: Track,
  node: string,
  attemptNo: number
): string {
  let errLog = `Error retrieving audio analysis on ${node}: ${message}. Attempt #${attemptNo} for track ID ${track.track_id}, track CID ${track.track_cid}`
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

async function getAudioAnalysis(contentNodes: string[], track: Track) {
  let result = null

  const trackCid = track.track_cid
  // skip tracks that already have their audio analyses
  if (
    !trackCid ||
    track.musical_key ||
    track.bpm ||
    track.audio_analysis_error_count! > 0
  )
    return result

  const audioUploadId = track.audio_upload_id || ''
  const isLegacyTrack = !audioUploadId

  const release = await semaphore.acquire() // acquire a semaphore permit

  // allow up to 5 attempts to get audio analysis for this track
  for (let i = 0; i < 5; i++) {
    // choose a random content node
    const contentNode =
      contentNodes[Math.floor(Math.random() * contentNodes.length)]
    try {
      let analysisUrl = `${contentNode}/uploads/${audioUploadId}`
      if (isLegacyTrack) {
        analysisUrl = `${contentNode}/tracks/legacy/${trackCid}/analysis`
      }

      const response = await axios.get(analysisUrl, {
        timeout: REQUEST_TIMEOUT
      })
      if (response.status == 200) {
        console.log(
          `Successfully retrieved audio analysis for track ID ${
            track.track_id
          }, track CID ${trackCid}${
            audioUploadId ? `, upload ID: ${audioUploadId}` : ''
          } via ${contentNode}`
        )
        const resultsKey = isLegacyTrack ? 'results' : 'audio_analysis_results'
        const errorCountKey = isLegacyTrack
          ? 'error_count'
          : 'audio_analysis_error_count'
        const results = response.data[resultsKey]
        const errorCount = response.data[errorCountKey]
        if (!results) {
          break
        }

        let musicalKey = null
        let bpm = null
        if (results?.key) {
          if (results?.key.length <= 12) {
            musicalKey = results?.key
          }
        } else if (results?.Key) {
          if (results?.Key.length <= 12) {
            musicalKey = results?.Key
          }
        }
        if (results?.bpm) {
          bpm = results?.bpm
        } else if (results?.BPM) {
          bpm = results?.BPM
        }

        if (
          musicalKey == track.musical_key &&
          bpm == track.bpm &&
          errorCount == track.audio_analysis_error_count
        ) {
          // nothing to update
          break
        }

        result = {
          track_id: track.track_id,
          musical_key: musicalKey,
          bpm,
          error_count: errorCount
        }
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
  return result
}

async function fetchTracks(
  offset: number,
  limit: number,
  db: Knex
): Promise<Track[]> {
  return await db<Track>('tracks')
    .select(
      'track_id',
      'track_cid',
      'audio_upload_id',
      'musical_key',
      'bpm',
      'audio_analysis_error_count'
    )
    .andWhere('track_cid', 'is not', null)
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
      getAudioAnalysis(
        contentNodes.map((node) => node.endpoint),
        track
      )
    )
    const updates = (await Promise.all(analyzePromises)).filter(
      (u) => u != null
    )

    console.log(`Updating ${updates.length} tracks`)

    await db.transaction(async (trx: any) => {
      for (const update of updates) {
        await trx('tracks')
          .where({ track_id: update!.track_id })
          .update({
            musical_key: update!.musical_key || trx.raw('musical_key'),
            bpm: update!.bpm || trx.raw('bpm'),
            audio_analysis_error_count: update!.error_count
          })
      }
    })

    offset += batchSize
    await storeDbOffset(DB_OFFSET_KEY, offset)
    console.timeEnd('Batch processing time')
    console.log(`Processed ${tracks.length} tracks. New offset: ${offset}`)

    if (config.testRun) {
      console.log(
        `[TEST RUN] Saved audio analyses for the following track IDs: ${tracks.map(
          (track) => track.track_id
        )}`
      )
      // only do 1 batch in a test run
      break
    }

    // sleep for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
}

export const backfillDiscovery = async (app: App<SharedData>) => {
  if (!config.delegatePrivateKey) {
    console.error('Missing required delegate private key. Terminating...')
    return
  }
  const db = app.getDnDb()
  const BACKFILL_BATCH_SIZE = config.testRun ? 100 : 3000
  await processBatches(db, BACKFILL_BATCH_SIZE)

  console.log('backfill_discovery.ts | No more tracks to backfill. Goodbye!')
}
