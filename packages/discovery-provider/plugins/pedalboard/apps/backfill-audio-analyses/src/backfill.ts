import { AudiusLibs } from '@audius/sdk'
import axios from 'axios';
import { ethers } from 'ethers';
import { Semaphore } from 'await-semaphore';
import { Knex } from 'knex'
import { App } from '@pedalboard/basekit'
import { config } from '.'
import { SharedData } from './index'
import { storeDbOffset, readDbOffset, getCachedDiscoveryNodes, getCachedHealthyContentNodes } from './redis'

// Batch size for fetching tracks
const BACKFILL_BATCH_SIZE = 1000;

// Concurrency control
const MAX_CONCURRENT_REQUESTS = 10;
const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);

let BACKFILL_NODES = config.environment == 'prod' 
  ? 
    [
      "https://discoveryprovider.audius.co",
      "https://discoveryprovider2.audius.co",
      "https://discoveryprovider3.audius.co"
    ]
  : []
const DEFAULT_BPM = 0
const DEFAULT_MUSICAL_KEY = '-'
const POLL_STATUS_INTERVAL = 5000 // 5s
const REQUEST_TIMEOUT = 30000 // 30s

interface Track {
  track_id: number;
  audio_upload_id: string;
  musical_key: string | null;
  bpm: number | null;
  audio_analysis_error_count: number | null;
}

interface AnalysisResult {
  audio_analysis_status: string;
  status: string;
  audio_analysis_results: {
    bpm: number;
    key: string;
  };
}

function generateSignature(data: any, privateKey: string): string {
  const toSignStr = JSON.stringify(data, Object.keys(data).sort());
  const toSignHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(toSignStr));
  const signingKey = new ethers.utils.SigningKey(privateKey);
  const signature = signingKey.signDigest(toSignHash);
  return ethers.utils.joinSignature(signature);
}

function shuffleArray(array: string[]): string[] {
  let currentIndex = array.length, temporaryValue: string, randomIndex: number;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

async function analyzeAudio(libs: AudiusLibs, contentNodes: string[], track: Track): Promise<void> {
  const audioUploadId = track.audio_upload_id;

  const release = await semaphore.acquire(); // Acquire a semaphore permit
  for (const contentNodeEndpoint of contentNodes) {
    try {
      console.log(`Querying ${contentNodeEndpoint} for audio analysis for track ID ${track.track_id}, upload ID ${track.audio_upload_id}`)
      const analysisUrl = `${contentNodeEndpoint}/uploads/${audioUploadId}/analyze`;
      const timestamp = Math.floor(Date.now() / 1000); // current timestamp in seconds
      const dataToSign = {
        trackId: track.track_id,
        timestamp,
        uploadId: audioUploadId
      };
      const signature = generateSignature(dataToSign, config.delegatePrivateKey);
      const queryParams = new URLSearchParams({ signature });
      const response = await axios.post<AnalysisResult>(`${analysisUrl}?${queryParams.toString()}`, null, { timeout: REQUEST_TIMEOUT });
      if (response.status === 200) {
        const analysisResult = response.data;
        let audioAnalysisStatus = analysisResult.audio_analysis_status || '';

        // Handle polling if analysis is in progress
        if (audioAnalysisStatus === '' && analysisResult.status === 'audio_analysis') {
          const timeout = Date.now() + 90 * 1000; // 1.5 minutes timeout
          while (Date.now() < timeout) {
            await new Promise(resolve => setTimeout(resolve, POLL_STATUS_INTERVAL));
            const pollResponse = await axios.get<AnalysisResult>(`${contentNodeEndpoint}/uploads/${audioUploadId}`, { timeout: REQUEST_TIMEOUT });
            if (pollResponse.status === 200) {
              const pollResult = pollResponse.data;
              if (pollResult.audio_analysis_status === 'done') {
                audioAnalysisStatus = 'done';
                analysisResult.audio_analysis_results = pollResult.audio_analysis_results;
                break;
              }
            }
          }
        }

        // Handle the result based on analysis status
        if (audioAnalysisStatus === 'timeout' || audioAnalysisStatus === 'error' || (audioAnalysisStatus === '' && analysisResult.status === 'audio_analysis')) {
          // Audio analysis job ran and errored, or we timed out waiting for an update from the content node
          await writeToChain(libs, track.track_id, DEFAULT_MUSICAL_KEY, DEFAULT_BPM, (track.audio_analysis_error_count || 0) + 1);
        } else if (audioAnalysisStatus === 'done') {
          const bpm = analysisResult.audio_analysis_results.bpm || DEFAULT_BPM;
          const key = analysisResult.audio_analysis_results.key || DEFAULT_MUSICAL_KEY;
          await writeToChain(libs, track.track_id, key, bpm, track.audio_analysis_error_count || 0);
        }
      } else {
        console.log(`Received ${response.status} response from ${contentNodeEndpoint}. Trying next node in rendezvous order`)
        continue
      }
    } catch (error: any) {
      if (error.isAxiosError !== undefined && error.code === 'ECONNABORTED') {
        console.log(`Timeout error analyzing audio for track ID ${track.track_id}: ${error.message}`);
        continue
      } else {
        console.error(`Error analyzing audio for track ID ${track.track_id}, upload ID ${track.audio_upload_id}: ${(error as Error).message}`);
        break
      }
    }

    release(); // Release the semaphore permit
  }
}

async function fetchTracks(offset: number, limit: number, nodeId: number, db: Knex): Promise<Track[]> {
  return await db<Track>('tracks')
    .whereNull('musical_key')
    .whereNull('bpm')
    .andWhere('audio_analysis_error_count', 0)
    .andWhere(db.raw('(track_id % ?) = ?', [BACKFILL_NODES.length, nodeId]))
    .orderBy('track_id')
    .offset(offset)
    .limit(limit);
}

// Backfill BACKFILL_BATCH_SIZE tracks at a time
async function processBatches(libs: AudiusLibs, db: Knex, nodeId: number): Promise<void> {
  let offset
  while (true) {
    console.time('Batch processing time');
    const contentNodes = await getCachedHealthyContentNodes()
    if (contentNodes.length == 0) {
      console.timeEnd('Batch processing time');
      console.error(`No healthy content nodes found. Please investigate`)
      return
    }
    // Take 5 random endpoints to query for audio analysis
    const endpoints = shuffleArray(contentNodes.map(node => node.endpoint)).slice(0, 5)
    offset = await readDbOffset(nodeId)
    if (offset == null) {
      offset = 0
    }
    const tracks = await fetchTracks(offset, BACKFILL_BATCH_SIZE, nodeId, db);
    if (tracks.length === 0) {
      console.timeEnd('Batch processing time');
      break;
    }
    const analyzePromises = tracks.map(track => analyzeAudio(libs, endpoints, track));
    await Promise.all(analyzePromises);

    offset += BACKFILL_BATCH_SIZE;
    await storeDbOffset(nodeId, offset)
    console.timeEnd('Batch processing time');
    console.log(`Backfilled audio analyses for ${tracks.length} tracks. New offset: ${offset}`);

    // Sleep for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  console.log("No more tracks to backfill. Terminating...")
}

async function writeToChain(libs: AudiusLibs, trackId: number, musicalKey: string, bpm: number, errorCount: number): Promise<void> {
  console.log(`Writing to chain: ${trackId}, Key: ${musicalKey}, BPM: ${bpm}, Errors: ${errorCount}`);
  const trackUpdate = {
    track_id: trackId,
    musical_key: musicalKey,
    bpm: bpm,
    audio_analysis_error_count: errorCount,
  }
  const res = await libs.contracts!.EntityManagerClient!.manageEntity(
    0, // userId
    // @ts-ignore
    'Track', // EntityManagerClient.EntityType.TRACK,
    0, // userId
    // @ts-ignore
    'Update', // EntityManagerClient.Action.UPDATE,
    JSON.stringify(trackUpdate),
    config.delegatePrivateKey
  )
  console.log({ res })
}

export const backfill = async (app: App<SharedData>) => {
  const { libs } = app.viewAppData()
  const db = app.getDnDb()
  const myUrl = config.url
  if (BACKFILL_NODES.length == 0) {
    BACKFILL_NODES = (await getCachedDiscoveryNodes()).map(node => node.endpoint)
  }
  const nodeId = BACKFILL_NODES.indexOf(myUrl)

  if (nodeId == -1) {
    console.error(`${myUrl} not in backfill node allowlist. Terminating...`)
    return
  }

  await processBatches(libs, db, nodeId)
}
