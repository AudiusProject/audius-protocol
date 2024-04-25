import Database from 'better-sqlite3'
import { DDEXRelease } from './parseDelivery'

const dbLocation = process.env.SQLITE_URL || 'scratchy.db'
const db = new Database(dbLocation)

db.pragma('journal_mode = WAL')

db.exec(`

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

create table if not exists s3markers (
  bucket text primary key,
  marker text not null
);

`)

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

export type ReleaseRow = {
  key: string
  xmlUrl: string
  json: string

  entityType?: string
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
    const markerRow = db
      .prepare(`select marker from s3markers where bucket = ?`)
      .bind(bucket)
      .get() as S3MarkerRow | undefined
    return markerRow?.marker || ''
  },

  upsert(bucket: string, marker: string) {
    db.prepare('replace into s3markers values (?, ?)')
      .bind(bucket, marker)
      .run()
  },
}

//
// user repo
//

export const userRepo = {
  all() {
    return db.prepare(`select * from users`).all() as UserRow[]
  },

  match(artistNames: string[]) {
    const artistSet = new Set(artistNames.map(lowerAscii))
    const users = db.prepare('select * from users').all() as UserRow[]
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
    return db.prepare(`select * from xmls order by xmlUrl`).all() as XmlRow[]
  },

  get(xmlUrl: string) {
    return db
      .prepare(`select * from xmls where xmlUrl = ?`)
      .bind(xmlUrl)
      .get() as XmlRow | undefined
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

export const releaseRepo = {
  all() {
    const rows = db
      .prepare(`select * from releases order by xmlUrl, ref`)
      .all() as ReleaseRow[]
    for (const row of rows) {
      if (row.json) row._parsed = JSON.parse(row.json)
    }
    return rows
  },

  get(key: string) {
    const row = db
      .prepare(`select * from releases where key = ?`)
      .bind(key)
      .get() as ReleaseRow
    if (!row) return
    if (row.json) row._parsed = JSON.parse(row.json)
    return row
  },

  upsert(xmlUrl: string, release: DDEXRelease) {
    const key = release.isrc || release.icpn
    if (!key) {
      console.log(`No ID for release`, release)
      throw new Error('No ID for release')
    }
    dbUpsert('releases', {
      key,
      ref: release.ref,
      xmlUrl,
      json: JSON.stringify(release),
      updatedAt: new Date().toISOString(),
    })
  },

  addPublishError(key: string, err: Error) {
    db.prepare(
      `update releases set lastPublishError=?, publishErrorCount=publishErrorCount+1 where key = ?`
    )
      .bind(err.toString(), key)
      .run()
  },
}

//
// db utils
//

export function dbUpdate(
  table: string,
  pkField: string,
  data: Record<string, any>
) {
  if (!data[pkField]) {
    throw new Error(`must provide ${pkField} to update ${table}`)
  }
  const qs = Object.entries(data)
    .map(([k, v]) => ` ${k}=? `)
    .join(',')

  // if everything used integer pks, we could just use rowid
  // ... if we wanted compound pks, pkField should be an array
  const stmt = `update ${table} set ${qs} where ${pkField} = ${data[pkField]}`
  return db
    .prepare(stmt)
    .bind(...Object.values(data))
    .run()
}

export function dbUpsert(table: string, data: Record<string, any>) {
  const fields = Object.keys(data).join(',')
  const qs = Object.keys(data)
    .map((f) => '?')
    .join(',')
  const excludes = Object.keys(data)
    .map((f) => `${f} = excluded.${f}`)
    .join(',')
  const stmt = `
    insert into ${table} (${fields}) values (${qs})
    on conflict do update set ${excludes}`
  return db
    .prepare(stmt)
    .bind(...Object.values(data))
    .run()
}
