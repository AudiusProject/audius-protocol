import sql, { Database } from '@radically-straightforward/sqlite'
import { DDEXRelease } from './parseDelivery'
import { Statement } from 'better-sqlite3'

const dbLocation = process.env.SQLITE_URL || 'data/dev.db'
const db = new Database(dbLocation)

db.pragma('journal_mode = WAL')

db.migrate(
  sql`

create table if not exists xmls (
  xmlUrl text primary key,
  xmlText text not null,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

create table if not exists users (
  id text primary key,
  handle text not null,
  name text not null,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

create table if not exists releases (
  key text primary key,
  ref text,
  xmlUrl text,
  json jsonb,
  status text not null,

  entityType text,
  entityId text,
  blockHash text,
  blockNumber integer,
  publishedAt datetime,

  publishErrorCount integer default 0,
  lastPublishError text,

  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME
);

create index if not exists releasesStatusIndex on releases(status);

create table if not exists s3markers (
  bucket text primary key,
  marker text not null
);
`
)

export type XmlRow = {
  xmlText: string
  xmlUrl: string
  createdAt: string
}

export type UserRow = {
  id: string
  handle: string
  name: string
  createdAt: string
}

export enum ReleaseProcessingStatus {
  Parsed = 'Parsed',
  Blocked = 'Blocked',
  Published = 'Published',
  Failed = 'Failed',
  Deleted = 'Deleted',
}

export type ReleaseRow = {
  key: string
  xmlUrl: string
  json: string
  status: ReleaseProcessingStatus

  entityType?: 'track' | 'album'
  entityId?: string
  blockHash?: string
  blockNumber?: number
  publishedAt?: string

  publishErrorCount: number
  lastPublishError: string

  _parsed?: DDEXRelease
}

export type S3MarkerRow = {
  bucket: string
  marker: string
}

//
// s3cursor repo
//
export const s3markerRepo = {
  get(bucket: string) {
    const markerRow = db.get<S3MarkerRow>(
      sql`select marker from s3markers where bucket = ${bucket}`
    )
    return markerRow?.marker || ''
  },

  upsert(bucket: string, marker: string) {
    db.run(sql`replace into s3markers values (${bucket}, ${marker})`)
  },
}

//
// user repo
//

export const userRepo = {
  all() {
    return db.all<UserRow>(sql`select * from users`)
  },

  match(artistNames: string[]) {
    const artistSet = new Set(artistNames.map(lowerAscii))
    const users = db.all<UserRow>(sql`select * from users`)
    for (const u of users) {
      if (
        artistSet.has(lowerAscii(u.name)) ||
        artistSet.has(lowerAscii(u.handle))
      ) {
        return u.id
      }
    }
  },
}

function lowerAscii(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

//
// xml repo
//

export const xmlRepo = {
  all() {
    return db.all<XmlRow>(sql`select * from xmls order by xmlUrl`)
  },

  get(xmlUrl: string) {
    return db.get<XmlRow>(sql`select * from xmls where xmlUrl = ${xmlUrl}`)
  },

  upsert(xmlUrl: string, xmlText: string) {
    dbUpsert('xmls', {
      xmlUrl,
      xmlText,
    })
  },
}

//
// release repo
//

type FindReleaseParams = {
  pendingPublish?: boolean
  status?: string
}

export const releaseRepo = {
  all(params?: FindReleaseParams) {
    params ||= {}
    const rows = db.all<ReleaseRow>(sql`
      select * from releases
      where 1=1

      -- pending publish
      $${
        params.pendingPublish
          ? sql` and status in ('Parsed', 'Failed') and publishErrorCount < 5 `
          : sql``
      }

      $${params.status ? sql` and status = ${params.status} ` : sql``}

      order by xmlUrl, ref
    `)

    for (const row of rows) {
      if (row.json) row._parsed = JSON.parse(row.json)
    }
    return rows
  },

  get(key: string) {
    const row = db.get<ReleaseRow>(
      sql`select * from releases where key = ${key}`
    )
    if (!row) return
    if (row.json) row._parsed = JSON.parse(row.json)
    return row
  },

  update(r: Partial<ReleaseRow>) {
    dbUpdate('releases', 'key', r)
  },

  upsert(xmlUrl: string, release: DDEXRelease) {
    const key = release.isrc || release.icpn || release.releaseIds.grid
    if (!key) {
      console.log(`No ID for release`, release)
      throw new Error('No ID for release')
    }

    const status: ReleaseRow['status'] = release.problems.length
      ? ReleaseProcessingStatus.Blocked
      : ReleaseProcessingStatus.Parsed

    dbUpsert('releases', {
      key,
      status,
      ref: release.ref,
      xmlUrl,
      json: JSON.stringify(release),
      updatedAt: new Date().toISOString(),
    } as Partial<ReleaseRow>)
  },

  addPublishError(key: string, err: Error) {
    const status = ReleaseProcessingStatus.Failed
    const errText = err.stack || err.toString()
    db.run(sql`
      update releases set
        status=${status},
        lastPublishError=${errText},
        publishErrorCount=publishErrorCount+1
      where key = ${key}
    `)
  },
}

//
// db utils
//

const stmtCache: Record<string, Statement> = {}

function toStmt(rawSql: string) {
  if (!stmtCache[rawSql]) {
    stmtCache[rawSql] = db.prepare(rawSql)
  }
  return stmtCache[rawSql]
}

export function dbUpdate(
  table: string,
  pkField: string,
  data: Record<string, any>
) {
  if (!data[pkField]) {
    throw new Error(`must provide ${pkField} to update ${table}`)
  }
  const qs = Object.keys(data)
    .map((k) => ` ${k}=? `)
    .join(',')

  // if everything used integer pks, we could just use rowid
  // ... if we wanted compound pks, pkField should be an array
  const rawSql = `update ${table} set ${qs} where ${pkField} = ?`

  return toStmt(rawSql).run(...Object.values(data), data[pkField])
}

export function dbUpsert(table: string, data: Record<string, any>) {
  const fields = Object.keys(data).join(',')
  const qs = Object.keys(data)
    .map(() => '?')
    .join(',')
  const excludes = Object.keys(data)
    .map((f) => `${f} = excluded.${f}`)
    .join(',')
  const rawSql = `
    insert into ${table} (${fields}) values (${qs})
    on conflict do update set ${excludes}`
  return toStmt(rawSql).run(...Object.values(data))
}
