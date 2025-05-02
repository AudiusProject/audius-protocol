import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publish } from '../s3'
import { readConfig } from '../config'
import { formatDate } from '../date'
import dayjs from 'dayjs'

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
export const clm = async (db: Knex, date: Date): Promise<void> => {
  const logger = plogger.child({ date: date.toISOString() })
  logger.info('beginning client label metadata processing')

  // Gather data from "YYYY-MM-DDT00:00:00.000Z" to "YYYY-MM-DDT23:59:59.999Z"
  const startOfThisMonth = dayjs(date).startOf('month')
  const startOfLastMonth = startOfThisMonth.subtract(1, 'month')

  const start = startOfLastMonth.toDate()
  const end = startOfThisMonth.toDate()

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
      "album"."playlist_name" as "AlbumTitle",
      "album"."playlist_id" as "AlbumId",
      '' as "ReleaseLabel",
      "tracks"."isrc" as "ISRC",
      "album"."upc" as "UPC",
      '' as "Composer",
      "tracks"."duration" as "Duration",
      'Audio' as "ResourceType"
    FROM "tracks"
    JOIN "users" ON "tracks"."owner_id" = "users"."user_id"
    LEFT JOIN LATERAL (
      SELECT playlist_id, playlist_name, upc
      FROM playlist_tracks
      JOIN playlists USING (playlist_id)
      WHERE playlist_tracks.track_id = tracks.track_id
      AND is_album = TRUE
      AND is_delete = FALSE
      AND is_private = FALSE
      ORDER BY playlists.created_at ASC, playlist_id ASC
      LIMIT 1
    ) album ON true
    WHERE "tracks"."created_at" >= :start
      AND "tracks"."created_at" < :end
  `,
      { start, end }
    )
    .then((result) => result.rows)

  const csv = toCsvString(clmRows, ClientLabelMetadataHeader)
  const fileName = `inputs/clm/Audius_CLM_${formatDate(date)}.csv`
  const results = await publish(logger, csv, fileName)

  results.forEach((objUrl) =>
    logger.info({ objUrl, records: clmRows.length }, 'upload result')
  )
}
