import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publishToS3 } from '../s3'
import { readConfig } from '../config'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { formatDateISO, getYearMonth, getYearMonthDay, getYearMonthShorthand } from '../date'

dayjs.extend(quarterOfYear)

const config = readConfig()
const isDev = config.env === 'dev'

type MrvrAffirmative = {
  ['Downloads - Gross Revenues without Permitted Deductions']: number
  ['Downloads - Gross Revenues with Permitted Deductions']: number
  ['Downloads - Gross Revenues without Permitted Deductions - USA Only']: number
  ['Downloads - Gross Revenues with Permitted Deductions - USA Only']: number
  ['Downloads - Public Performance Fees']: number
  ['Downloads - Record Label Payments']: number
  ['Subscription - Gross Revenues without Permitted Deductions']: number
  ['Subscription - Gross Revenues with Permitted Deductions']: number
  ['Subscription - Gross Revenues without Permitted Deductions - USA Only']: number
  ['Subscription - Gross Revenues with Permitted Deductions - USA Only']: number
  ['Subscription - Public Performance Fees']: number
  ['Subscription - Record Label Payments']: number
  ['Subscription - Average Subscription Price']: number
  ['Subscription - Total Subscribers']: number
  ['Subscription - Total Subscribers - USA Only']: number
  ['Aggregate Transmission Hours - USA Only']: number
}

type MrvrCbs = {
  'Offering': 'Downloads / Monetized Content' | 'Subscription'
  'UserType': 'Paid'
  ['Subscriber Count']: 0
  ['Gross Revenue']: number
  ['Gross revenue With Deductions']: number
  'Territory': string
  'Has_usage_flag': boolean
  'Total Downloads': number
  'Total Streams': number
  'Currency': 'USD'
}

const MrvrAffirmativeHeader: (keyof MrvrAffirmative)[] = [
  'Downloads - Gross Revenues without Permitted Deductions',
  'Downloads - Gross Revenues with Permitted Deductions',
  'Downloads - Gross Revenues without Permitted Deductions - USA Only',
  'Downloads - Gross Revenues with Permitted Deductions - USA Only',
  'Downloads - Public Performance Fees',
  'Downloads - Record Label Payments',
  'Subscription - Gross Revenues without Permitted Deductions',
  'Subscription - Gross Revenues with Permitted Deductions',
  'Subscription - Gross Revenues without Permitted Deductions - USA Only',
  'Subscription - Gross Revenues with Permitted Deductions - USA Only',
  'Subscription - Public Performance Fees',
  'Subscription - Record Label Payments',
  'Subscription - Average Subscription Price',
  'Subscription - Total Subscribers',
  'Subscription - Total Subscribers - USA Only',
  'Aggregate Transmission Hours - USA Only',
 
]

const MrvrCbsHeader: (keyof MrvrCbs)[] = [
  'Offering',
  'UserType',
  'Subscriber Count',
  'Gross Revenue',
  'Gross revenue With Deductions',
  'Territory',
  'Has_usage_flag',
  'Total Downloads',
  'Total Streams',
  'Currency',
 
]

// gathers data from a month period prior to the provided date.
// formats it into csv format compatible with the mri spec
// publishes it to all the provided s3 configs
export const mrvr = async (
  db: Knex,
  s3s: S3Config[],
  date: Date
): Promise<void> => {
  const logger = plogger.child({ date: date.toISOString() })
  logger.info('beginning usage detail report processing')
  const startOfThisMonth = dayjs(date).startOf('month')
  const startOfLastMonth = startOfThisMonth.subtract(1, 'month')

  const start = startOfLastMonth.toDate()
  const end = startOfThisMonth.toDate()

  logger.info(
    { start: start.toISOString(), end: end.toISOString() },
    'time range'
  )

  const affirmative = async () => {
    const mrvrAffirmativeResult = await db.raw(
      `
      select
        revenue."Downloads - Gross Revenues without Permitted Deductions",
        revenue."Downloads - Gross Revenues with Permitted Deductions",
        revenue."Downloads - Gross Revenues without Permitted Deductions - USA Only",
        revenue."Downloads - Gross Revenues with Permitted Deductions - USA Only",
        revenue."Downloads - Public Performance Fees",
        revenue."Downloads - Record Label Payments",
        revenue."Subscription - Gross Revenues without Permitted Deductions",
        revenue."Subscription - Gross Revenues with Permitted Deductions",
        revenue."Subscription - Gross Revenues without Permitted Deductions - USA Only",
        revenue."Subscription - Gross Revenues with Permitted Deductions - USA Only",
        revenue."Subscription - Public Performance Fees",
        revenue."Subscription - Record Label Payments",
        revenue."Subscription - Average Subscription Price",
        revenue."Subscription - Total Subscribers",
        revenue."Subscription - Total Subscribers - USA Only",
        ath."Aggregate Transmission Hours - USA Only"
      from
        (
          select
            sum(("amount" + "extra_amount") / 1000000) as "Downloads - Gross Revenues without Permitted Deductions",
            sum(("amount" + "extra_amount") / 1000000) as "Downloads - Gross Revenues with Permitted Deductions",
            sum(
              case
                when "country" = 'United States'
                then ("amount" + "extra_amount") / 1000000
                else 0
              end
            ) as "Downloads - Gross Revenues without Permitted Deductions - USA Only",
            sum(
              case
                when "country" = 'United States'
                then ("amount" + "extra_amount") / 1000000
                else 0
              end
            ) as "Downloads - Gross Revenues with Permitted Deductions - USA Only",
            0 as "Downloads - Public Performance Fees",
            0 as "Downloads - Record Label Payments",
            0 as "Subscription - Gross Revenues without Permitted Deductions",
            0 as "Subscription - Gross Revenues with Permitted Deductions",
            0 as "Subscription - Gross Revenues without Permitted Deductions - USA Only",
            0 as "Subscription - Gross Revenues with Permitted Deductions - USA Only",
            0 as "Subscription - Public Performance Fees",
            0 as "Subscription - Record Label Payments",
            0 as "Subscription - Average Subscription Price",
            0 as "Subscription - Total Subscribers",
            0 as "Subscription - Total Subscribers - USA Only"
          from "usdc_purchases"
          where
            "created_at" >= :start
            and "created_at" < :end
        ) as revenue
        cross join
        (
          select
            sum(cast("count" * "duration" as float) / 3600.0) as "Aggregate Transmission Hours - USA Only"
          from (
            select
              "tracks"."duration" as "duration",
              "aggregate_monthly_plays"."count" as "count"
            from
              "tracks"
            join
              "aggregate_monthly_plays" on "tracks"."track_id" = "aggregate_monthly_plays"."play_item_id"
            where
              "aggregate_monthly_plays"."country" = 'United States'
              and "timestamp" >= :start
              and "timestamp" < :end
          ) as ath_data
        ) as ath;
      `,
      { start, end }
    )
  
    const mrvrAffirmativeRows: MrvrAffirmative[] = mrvrAffirmativeResult.rows
    const mrvrAffirmativeCsv = toCsvString(mrvrAffirmativeRows, MrvrAffirmativeHeader)
    if (isDev) {
      logger.info(mrvrAffirmativeCsv)
    }

    const now = new Date();
    // Audius_MRVR_aff_YYMM_YYYYMMDD.csv
    // YYMM = Year and Month of usage, YYYYMMDD = time of generation
    const fileName = `Audius_MRVR_aff_${getYearMonthShorthand(start)}_${getYearMonthDay(now)}`
  
    const uploads = s3s.map((s3config) =>
      publishToS3(logger, s3config, mrvrAffirmativeCsv, fileName)
    )
    const results = await Promise.allSettled(uploads)
    results.forEach((objUrl) =>
      logger.info({ objUrl, records: mrvrAffirmativeCsv.length }, 'mrvr affirmative upload result')
    )
  }
  // CBS
  const cbs = async () => {
    const mrvrAffirmativeCbs = await db.raw(
      `
      select
        "Offering",
        "UserType",
        "Subscriber Count",
        "Gross Revenue",
        "Gross revenue With Deductions", 
        "Territory",
        case when ("Total Downloads" > 0 or "Total Streams" > 0) then true else false end as "Has_usage_flag",
        "Total Downloads",
        "Total Streams",
        "Currency"
      from (
        select
          'Downloads / Monetized Content' as "Offering",
          'Paid' as "UserType",
          count(distinct "buyer_user_id") as "Subscriber Count",
          sum(("amount" + "extra_amount") / 1000000) as "Gross Revenue",
          sum(("amount" + "extra_amount") / 1000000) as "Gross revenue With Deductions",
          country_to_iso_alpha2(coalesce("country", '')) as "Territory",
          (
            select count(*)
            from track_downloads td
            where td.created_at >= :start
            and td.created_at < :end
            and td.country = usdc_purchases.country
          ) as "Total Downloads",
          (
            select sum("count")
            from aggregate_monthly_plays amp
            where amp.timestamp >= :start
            and amp.timestamp < :end
            and amp.country = usdc_purchases.country
          ) as "Total Streams",
          'USD' as "Currency"
        from "usdc_purchases"
        where
          "created_at" >= :start
          and "created_at" < :end
          and "country" is not null
        group by "country"

        union all

        select
          'Downloads / Monetized Content' as "Offering",
          'Free Trial (no payment details)' as "UserType",
          count(*) as "Subscriber Count",
          0 as "Gross Revenue",
          0 as "Gross revenue With Deductions",
          country_to_iso_alpha2(coalesce(plays."country", '')) as "Territory",
          (
              select count(*)
              from track_downloads td
              where td.created_at >= :start
              and td.created_at < :end
              and td.country = plays."country"
          ) as "Total Downloads",
          (
              select sum("count")
              from aggregate_monthly_plays amp
              where amp.timestamp >= :start
              and amp.timestamp < :end
              and amp.country = plays."country"
          ) as "Total Streams",
          'USD' as "Currency"
        from "users" users
        left join lateral (
            select p."country"
            from "plays" p
            where p."user_id" = users."user_id"
            order by p."created_at" desc
            limit 1
        ) plays on true
        where plays."country" is not null
        group by plays."country"
      ) subq
      `,
      { start, end }
    )

    const mrvrCbsRows: MrvrAffirmative[] = mrvrAffirmativeCbs.rows
    const mrvrCbsCsv = toCsvString(mrvrCbsRows, MrvrCbsHeader)
    if (isDev) {
      logger.info(mrvrCbsCsv)
    }
    const now = new Date();
    // YYYYMM_Audius_yyyymmddThhmmss_summary.csv
    // YYMM = Year and Month of usage, YYYYMMDD = time of generation
    const fileName = `${getYearMonth(start)}_Audius_${formatDateISO(now)}_summary`

    const uploads = s3s.map((s3config) =>
      publishToS3(logger, s3config, mrvrCbsCsv, fileName)
    )
    const results = await Promise.allSettled(uploads)
    results.forEach((objUrl) =>
      logger.info({ objUrl, records: mrvrCbsCsv.length }, 'mrvr cbs upload result')
    )
  }

  await affirmative()
  await cbs()
}
