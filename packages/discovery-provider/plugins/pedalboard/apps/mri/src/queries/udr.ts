import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publishToS3 } from '../s3'
import { readConfig } from '../config'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

dayjs.extend(quarterOfYear)

const config = readConfig()
const isDev = config.env === 'dev'

export type UsageDetailReporting = {
  ServiceName: 'AUDIUS'
  ReportPeriodType: 'Q'
  ReportingPeriod: string // MMDDYYYY
  ServiceType: 'I'
  SongTitle: string
  Artist: string
  AlbumId: number
  ISRC: string
  NumberOfPerformances: number
}

export const ClientLabelMetadataHeader: (keyof UsageDetailReporting)[] = [
  'ServiceName',
  'ReportPeriodType',
  'ReportingPeriod',
  'ServiceType',
  'SongTitle',
  'Artist',
  'AlbumId',
  'ISRC',
  'NumberOfPerformances'
]

// gathers data from a quarter period prior to the provide\ date.
// formats it into csv format compatible with the mri spec
// publishes it to all the provided s3 configs
export const udr = async (
  db: Knex,
  s3s: S3Config[],
  date: Date
): Promise<void> => {
  const logger = plogger.child({ date: date.toISOString() })
  logger.info('beginning usage detail report processing')
  const start = dayjs(date).startOf('quarter').toDate()
  const end = dayjs(date).startOf('quarter').add(1, 'quarter').toDate()
  const reportingPeriod = dayjs(end).format('MMDDYYYY')

  logger.info(
    { start: start.toISOString(), end: end.toISOString() },
    'time range'
  )

  const queryResult = await db.raw(
    `
      with play_counts as (
        select
          play_item_id as track_id,
          count(*) as play_count
        from plays
        where created_at > :start
          and created_at < :end
        group by 1
      )
      select
        'AUDIUS' as "ServiceName",
        'Q' as "ReportPeriodType",
        :reportingPeriod as "ReportingPeriod",
        'I' as "ServiceType",
        t.title as "SongTitle",
        u.name as "Artist",
        (
          select playlist_id
          from playlists join playlist_tracks using (playlist_id)
          where is_album = true and track_id = t.track_id
          limit 1
        ) as "AlbumId",
        t.isrc as "ISRC",
        play_count as "NumberOfPerformances"
      from play_counts c
      join tracks t using (track_id)
      join users u on t.owner_id = u.user_id
    `,
    { start, end, reportingPeriod }
  )

  const udrRows: UsageDetailReporting[] = queryResult.rows
  const csv = toCsvString(udrRows)
  if (isDev) {
    logger.info(csv)
  }

  const uploads = s3s.map((s3config) =>
    publishToS3(logger, s3config, date, csv)
  )
  const results = await Promise.allSettled(uploads)
  results.forEach((objUrl) =>
    logger.info({ objUrl, records: udrRows.length }, 'upload result')
  )
}
