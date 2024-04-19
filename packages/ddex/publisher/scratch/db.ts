import Database from 'better-sqlite3'
import { DDEXRelease } from './parseDelivery'
export const db = new Database('foobar.db')

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

  audiusGenre text,
  audiusUser text,

  soundRecordingCount integer,
  imageCount integer,
  failureCount integer default 0,

  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME
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

  _json?: DDEXRelease
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

export function upsertRelease(xmlText: string, release: DDEXRelease) {
  const ok = dbUpsert('releases', {
    key: release.isrc || release.icpn || 'dunno_' + release.ref,
    xmlText: xmlText,
    json: JSON.stringify(release),
    audiusGenre: release.audiusGenre,
    audiusUser: release.audiusUser,
    updatedAt: new Date().toISOString()
  })
}

export function dbUpsert(table: string, data: Record<string, any>) {
  const fields = Object.keys(data).join(',')
  const qs = Object.keys(data)
    .map((f) => '?')
    .join(',')
  const stmt = `replace into ${table} (${fields}) values (${qs})`
  return db
    .prepare(stmt)
    .bind(...Object.values(data))
    .run()
}
