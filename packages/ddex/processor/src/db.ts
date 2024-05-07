import sql, { Database } from '@radically-straightforward/sqlite'
import { DDEXRelease, DDEXReleaseIds } from './parseDelivery'
import { Statement } from 'better-sqlite3'

const dbLocation = process.env.SQLITE_URL || 'data/dev.db'
const db = new Database(dbLocation)

db.pragma('journal_mode = WAL')

db.migrate(
  sql`

create table if not exists xmls (
  xmlUrl text primary key,
  xmlText text not null,
  messageTimestamp text not null,
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
  messageTimestamp text,
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
  messageTimestamp: string
  createdAt: string
}

export type UserRow = {
  id: string
  handle: string
  name: string
  createdAt: string
}

export enum ReleaseProcessingStatus {
  Blocked = 'Blocked',
  PublishPending = 'PublishPending',
  Published = 'Published',
  Failed = 'Failed',
  DeletePending = 'DeletePending',
  Deleted = 'Deleted',
}

export type ReleaseRow = {
  key: string
  xmlUrl: string
  messageTimestamp: string
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

  upsert(user: Partial<UserRow>) {
    dbUpsert('users', user)
  },

  updateField(id: string, field: keyof UserRow, value: string | Date) {
    return db.run(sql`
      update users
      set ${field} = ${value}
      where id = ${id}
    `)
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

  upsert(row: Partial<XmlRow>) {
    dbUpsert('xmls', row)
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
  // todo: this is incomplete, and I'm not sure how to order which ID to use first.
  //   go version used xml file name
  //   but a single file can contain multiple releases
  //   so still need a way to pick an identifier, right?
  chooseReleaseId(releaseIds: DDEXReleaseIds) {
    const key = releaseIds.isrc || releaseIds.icpn || releaseIds.grid
    if (!key) {
      const msg = `failed to chooseReleaseId: ${JSON.stringify(releaseIds)}`
      console.log(msg)
      throw new Error(msg)
    }
    return key
  },

  all(params?: FindReleaseParams) {
    params ||= {}
    const rows = db.all<ReleaseRow>(sql`
      select * from releases
      where 1=1

      -- pending publish
      $${ifdef(
        params.pendingPublish,
        sql`
          and status in (
            ${ReleaseProcessingStatus.PublishPending},
            ${ReleaseProcessingStatus.Failed},
            ${ReleaseProcessingStatus.DeletePending}
          )
          and publishErrorCount < 5 `
      )}

      $${ifdef(params.status, sql` and status = ${params.status} `)}

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

  upsert: db.transaction(
    (xmlUrl: string, messageTimestamp: string, release: DDEXRelease) => {
      const key = releaseRepo.chooseReleaseId(release.releaseIds)
      const prior = releaseRepo.get(key)
      const json = JSON.stringify(release)

      // if prior exists and is newer, skip
      if (prior && prior.messageTimestamp > messageTimestamp) {
        console.log(`skipping ${xmlUrl} because ${key} is newer`)
        return
      }

      // if same xmlUrl + json, skip
      // may want some smarter json compare here
      // if this is causing spurious sdk updates to be issued
      if (prior && prior.xmlUrl == xmlUrl && prior.json == json) {
        return
      }

      const status: ReleaseRow['status'] = release.problems.length
        ? ReleaseProcessingStatus.Blocked
        : ReleaseProcessingStatus.PublishPending

      dbUpsert('releases', {
        key,
        status,
        ref: release.ref,
        xmlUrl,
        messageTimestamp,
        json,
        updatedAt: new Date().toISOString(),
      } as Partial<ReleaseRow>)
    }
  ),

  markForDelete: db.transaction(
    (xmlUrl: string, messageTimestamp: string, releaseIds: DDEXReleaseIds) => {
      // here we do PK lookup using the "best" id
      // but we may need to try to find by all the different releaseIds
      // if it's not consistent
      const key = releaseRepo.chooseReleaseId(releaseIds)
      const prior = releaseRepo.get(key)

      if (!prior) {
        console.log(`got purge release but no prior ${key}`)
        return
      }

      if (prior.messageTimestamp >= messageTimestamp) {
        console.log(`skipping delete ${key}`)
        return
      }

      releaseRepo.update({
        key,
        status: ReleaseProcessingStatus.DeletePending,
        xmlUrl,
        messageTimestamp,
      })
    }
  ),

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

function dbUpsert(table: string, data: Record<string, any>) {
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

function ifdef(obj: any, snippet: any) {
  return Boolean(obj) ? snippet : sql``
}
