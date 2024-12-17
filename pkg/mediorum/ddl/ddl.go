package ddl

import (
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"

	_ "embed"
)

//go:embed delist_statuses.sql
var delistStatusesDDL string

//go:embed add_delist_reasons.sql
var addDelistReasonsDDL string

//go:embed drop_blobs.sql
var dropBlobs string

//go:embed clean_uploads_audio_analyses.sql
var cleanUploadsAudioAnalysesDDL string

//go:embed add_play_queue.sql
var addPlayQueueDDL string

var mediorumMigrationTable = `
	create table if not exists mediorum_migrations (
		"hash" text primary key,
		"ts" timestamp
	);
`

var qmSyncTable = `
create table if not exists qm_sync (
	"host" text primary key
);
`

func Migrate(db *sql.DB, myHost string) {
	mustExec(db, mediorumMigrationTable)

	runMigration(db, delistStatusesDDL)
	runMigration(db, addDelistReasonsDDL)
	runMigration(db, addPlayQueueDDL)

	runMigration(db, dropBlobs)

	runMigration(db, `create index if not exists uploads_ts_idx on uploads(created_at, transcoded_at)`)

	runMigration(db, `drop table if exists "Files", "ClockRecords", "Tracks", "AudiusUsers", "CNodeUsers", "SessionTokens", "ContentBlacklists", "Playlists", "SequelizeMeta", blobs, cid_lookup, cid_log cascade`)

	runMigration(db, qmSyncTable)

	runMigration(db, cleanUploadsAudioAnalysesDDL)

	// cleanup crudr spam from blob not found errors
	runMigration(db, `
	delete from ops where
	data->0->>'error' like 'blob (key%NotFound%'
	`)

	runMigration(db, `vacuum full`)
}

func runMigration(db *sql.DB, ddl string) {
	h := md5string(ddl)

	var alreadyRan bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1`, h).Scan(&alreadyRan)
	if alreadyRan {
		fmt.Printf("hash %s exists skipping ddl \n", h)
		return
	}

	mustExec(db, ddl)
	mustExec(db, `insert into mediorum_migrations values ($1, now()) on conflict do nothing`, h)
}

func mustExec(db *sql.DB, ddl string, va ...interface{}) {
	_, err := db.Exec(ddl, va...)
	if err != nil {
		fmt.Println(ddl)
		log.Fatal(err)
	}
}

func md5string(s string) string {
	hash := md5.Sum([]byte(s))
	return hex.EncodeToString(hash[:])
}
