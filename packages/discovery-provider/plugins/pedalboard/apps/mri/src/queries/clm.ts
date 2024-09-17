import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publishToS3 } from '../s3'
import { readConfig } from '../config'
import { formatDate } from '../date'

const config = readConfig()
const isDev = config.env === 'dev'

type ClientLabelMetadata = {
  UniqueTrackIdentifier: number
  TrackTitle: string
  Artist: string
  AlbumTitle: string
  AlbumId: number
  ReleaseLabel: string
  ISRC: string
  UPC: string | null
  Composer: string
  Duration: number
  ResourceType: string
}

const ClientLabelMetadataHeader: (keyof ClientLabelMetadata)[] = [
  'UniqueTrackIdentifier',
  'TrackTitle',
  'Artist',
  'AlbumTitle',
  'AlbumId',
  'ReleaseLabel',
  'ISRC',
  'UPC',
  'Composer',
  'Duration',
  'ResourceType'
]

// gathers data from a 24 hour period between "YYYY-MM-DDT00:00:00.000Z" to "YYYY-MM-DDT23:59:59.999Z"
// formats it into csv format compatible with the mri spec
// publishes it to all the provided s3 configs
export const clm = async (
  db: Knex,
  s3s: S3Config[],
  date: Date
): Promise<void> => {
  const logger = plogger.child({ date: date.toISOString() })
  logger.info('beginning client label metadata processing')

  // Gather data from "YYYY-MM-DDT00:00:00.000Z" to "YYYY-MM-DDT23:59:59.999Z"
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 1)

  logger.info(
    { start: start.toISOString(), end: end.toISOString() },
    'time range'
  )

  const clmRows: ClientLabelMetadata[] = await db('tracks')
    .join('users', 'tracks.owner_id', '=', 'users.user_id')
    .leftJoin(
      'playlist_tracks',
      'tracks.track_id',
      '=',
      'playlist_tracks.track_id'
    )
    .leftJoin('playlists', function () {
      this.on(
        'playlist_tracks.playlist_id',
        '=',
        'playlists.playlist_id'
      ).andOn('playlists.is_album', '=', db.raw('true'))
    })
    .distinctOn('tracks.track_id')
    .select(
      `tracks.track_id as UniqueTrackIdentifier`,
      `tracks.title as TrackTitle`,
      db.raw(`coalesce(users.name, users.handle) as Artist`),
      `playlists.playlist_name as AlbumTitle`,
      `playlists.playlist_id as AlbumId`,
      db.raw(`'' as "ReleaseLabel"`),
      `tracks.isrc as ISRC`,
      `playlists.upc as UPC`,
      db.raw(`'' as "Composer"`),
      `tracks.duration as Duration`,
      db.raw(`'Audio' as "ResourceType"`)
    )
    .where('tracks.created_at', '>=', start)
    .where('tracks.created_at', '<', end)

  const csv = toCsvString(clmRows, ClientLabelMetadataHeader)
  if (isDev) {
    logger.info(csv)
  }

  const uploads = s3s.map((s3config) =>
    publishToS3(logger, s3config, csv, formatDate(date))
  )
  const results = await Promise.allSettled(uploads)
  results.forEach((objUrl) =>
    logger.info({ objUrl, records: clmRows.length }, 'upload result')
  )
}
