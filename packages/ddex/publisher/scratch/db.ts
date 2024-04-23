import Database from 'better-sqlite3'
import { DDEXRelease } from './parseDelivery'

const dbLocation = process.env.SQLITE_URL || 'scratchy.db'
export const db = new Database(dbLocation)

db.pragma('journal_mode = WAL')

db.exec(`

create table if not exists users (
  id text primary key,
  handle text not null,
  name text not null
);

create table if not exists releases (
  key text primary key,
  xmlText text,
  json jsonb,

  xmlUrl text, -- location of the xml file... needed to resolve relative location of resources

  entityType text,
  entityId text,
  blockHash text,
  blockNumber integer,
  publishedAt datetime,

  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME
);

create table if not exists s3markers (
  bucket text primary key,
  marker text not null
);

`)

export type UserRow = {
  id: string
  handle: string
  name: string
}

export type ReleaseRow = {
  key: string
  xmlText: string
  json: string

  xmlUrl?: string

  entityType?: string
  entityId?: string
  blockHash?: string
  blockNumber?: number
  publishedAt?: string

  _json?: DDEXRelease
}

export type S3MarkerRow = {
  bucket: string
  marker: string
}

export function matchAudiusUser(artistNames: string[]) {
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
}

function lowerAscii(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function upsertRelease(
  xmlUrl: string,
  xmlText: string,
  release: DDEXRelease
) {
  const key = release.isrc || release.icpn
  if (!key) {
    console.log(`No ID for release`, release)
    throw new Error('No ID for release')
  }
  dbUpsert('releases', {
    key,
    xmlUrl,
    xmlText,
    json: JSON.stringify(release),
    updatedAt: new Date().toISOString()
  })
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
