import type { Sql } from 'postgres'
import type {
  AudiusSdk as AudiusSdkType,
  UploadTrackRequest,
  Genre,
} from '@audius/sdk/dist/sdk/index.d.ts'
import type { queueAsPromised } from 'fastq'
import type { ReleaseRow } from '../models/dbTypes'
import fastq from 'fastq'
import fs from 'fs'
import path from 'path'

/**
 * Finds pending track and album releases that are at or past their scheduled release date, and uploads them to Audius.
 */

export interface ScheduledReleaseService {
  // TODO: Add a getter for an API endpoint to expose releases of various statuses to the frontend
}

export const createScheduledReleaseService = (
  sql: Sql,
  audiusSdk: AudiusSdkType
): ScheduledReleaseService => {
  const worker = async (release: ReleaseRow) => {
    console.log('Processing release', release)
    const err = await upload(release)
    if (err) {
      console.error('Error uploading release ${release.id}:', err)
      await sql`UPDATE releases SET status = 'error' WHERE id = ${release.id}`
    } else {
      await sql`UPDATE releases SET status = 'success' WHERE id = ${release.id}`
    }
  }

  const queue: queueAsPromised<ReleaseRow> = fastq.promise(worker, 1)

  // Every 5 seconds, scan the db for pending releases and enqueue them to be uploaded
  const enqueuePendingReleases = async () => {
    try {
      const pending = await sql<
        ReleaseRow[]
      >`SELECT * FROM releases WHERE status = 'pending' and release_date <= NOW()`
      for (const release of pending) {
        // TODO: If we do this then if the server restarts it'll see everything as processing and not re-add it to the queue.
        // Need to add all releases in 'processing' state to the queue on server start in case it restarted in the middle of processing.
        await sql`UPDATE releases SET status = 'processing' WHERE id = ${release.id}`
        queue.push(release)
      }
    } catch (error) {
      console.error('Error processing releases:', error)
    } finally {
      setTimeout(enqueuePendingReleases, 5000)
    }
  }
  enqueuePendingReleases()

  // TODO: We'll want a similar cron to scan for failed releases and re-process them

  const upload = async (release: ReleaseRow) => {
    const uploadTrackRequest: UploadTrackRequest = {
      userId: release.data.userId,
      // TODO replace with actual img file from upload request
      coverArtFile: {
        buffer: await fs.promises.readFile(
          path.join(__dirname, '..', 'examples', 'clipper.jpg')
        ),
        name: 'todo_file_name',
      },
      metadata: {
        title: release.data.title,

        // todo: need to normalize genre
        // genre: firstValue(trackNode, "Genre", "trackGenre"),
        genre: release.data.genre as Genre,

        // todo: need to parse release date if present
        releaseDate: release.release_date,

        isUnlisted: release.data.isUnlisted,
        isPremium: release.data.isPremium,
        fieldVisibility: release.data.fieldVisibility,
        description: release.data.description,
        license: release.data.license,
      },
      onProgress: (progress: any) => console.log('Progress:', progress),
      // TODO replace with actual audio file from upload request
      trackFile: {
        buffer: await fs.promises.readFile(
          path.join(__dirname, '..', 'examples', 'snare.wav')
        ),
        name: 'todo_track_file_name',
      },
    }
    console.log('uploading track...')
    const result = await audiusSdk.tracks.uploadTrack(uploadTrackRequest)
    console.log(result)
    return null
  }

  return {}
}
