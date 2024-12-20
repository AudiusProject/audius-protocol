import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publish } from '../s3'
import { readConfig } from '../config'
import { formatDate } from '../date'

const config = readConfig()

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

  const clmRows: ClientLabelMetadata[] = await db
    .raw(
      `
    select distinct on ("tracks"."track_id")
      "tracks"."track_id" as "UniqueTrackIdentifier",
      "tracks"."title" as "TrackTitle",
      coalesce(nullif(trim("users"."name"), ''), "users"."handle") as "Artist",
      "playlists"."playlist_name" as "AlbumTitle",
      "playlists"."playlist_id" as "AlbumId",
      '' as "ReleaseLabel",
      "tracks"."isrc" as "ISRC",
      "playlists"."upc" as "UPC",
      '' as "Composer",
      "tracks"."duration" as "Duration",
      'Audio' as "ResourceType"
    from "tracks"
    join "users" on "tracks"."owner_id" = "users"."user_id"
    left join "playlist_tracks" on "tracks"."track_id" = "playlist_tracks"."track_id"
    left join "playlists" on "playlist_tracks"."playlist_id" = "playlists"."playlist_id"
      and "playlists"."is_album" = true
    where "tracks"."created_at" >= :start
      and "tracks"."created_at" < :end
  `,
      { start, end }
    )
    .then((result) => result.rows)

  const csv = toCsvString(clmRows, ClientLabelMetadataHeader)
  const results = await publish(logger, s3s, csv, formatDate(date))

  results.forEach((objUrl) =>
    logger.info({ objUrl, records: clmRows.length }, 'upload result')
  )
}
