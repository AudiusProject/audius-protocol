import 'dotenv/config'

import postgres from 'postgres'

export const sql = postgres(process.env.identityDbUrl || '')

type FingerprintCount = {
  fingerprint: string
  userCount: number
  userIds: number[]
}

export async function userFingerprints(userId: number) {
  const rows: FingerprintCount[] = await sql`
    select
      "visitorId" as "fingerprint",
      count(distinct "userId") as "userCount",
      array_agg("userId") as "userIds"
    from "Fingerprints"
    where "visitorId" in (
      select "visitorId" from "Fingerprints" where "userId" = ${userId}
    )
    group by 1 order by 2 desc limit 90;
  `

  for (const row of rows) {
    row.userIds.sort()
  }

  return rows
}
