package ddl

import (
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"os"

	_ "embed"

	"gocloud.dev/blob"
	"golang.org/x/exp/slog"
)

//go:embed delist_statuses.sql
var delistStatusesDDL string

//go:embed add_delist_reasons.sql
var addDelistReasonsDDL string

//go:embed drop_blobs.sql
var dropBlobs string

var mediorumMigrationTable = `
	create table if not exists mediorum_migrations (
		"hash" text primary key,
		"ts" timestamp
	);
`

func Migrate(db *sql.DB, bucket *blob.Bucket, myHost string) {
	mustExec(db, mediorumMigrationTable)

	runMigration(db, delistStatusesDDL)
	runMigration(db, addDelistReasonsDDL)

	runMigration(db, dropBlobs)

	runMigration(db, `create index if not exists uploads_ts_idx on uploads(created_at, transcoded_at)`)
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

func logAndWriteToFile(message string, fileName string) {
	dir := "/tmp/mediorum"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.Mkdir(dir, 0755)
	}
	filePath := fmt.Sprintf("/tmp/mediorum/%s", fileName)

	f, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		slog.Error(fmt.Sprintf("Error opening %s", fileName), "err", err)
		return
	}
	defer f.Close()

	slog.Info(message)

	if _, err := f.WriteString(message + "\n"); err != nil {
		slog.Error(fmt.Sprintf("Error writing to %s", fileName), "err", err)
		return
	}

	f.Sync()
}
