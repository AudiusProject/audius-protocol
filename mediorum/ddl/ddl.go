package ddl

import (
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	_ "embed"

	"golang.org/x/exp/slog"
)

//go:embed cid_lookup.sql
var cidLookupDDL string

//go:embed delist_statuses.sql
var delistStatusesDDL string

var mediorumMigrationTable = `
	create table if not exists mediorum_migrations (
		"hash" text primary key,
		"ts" timestamp
	);
`

func Migrate(db *sql.DB) {
	mustExec(db, mediorumMigrationTable)

	// TODO: safe to remove after everyone runs it once
	slog.Info("checking if it's time to re-seed...")
	var reseeding bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = 'reseeding'`).Scan(&reseeding)
	if reseeding {
		slog.Info("re-seeding and restarting server...")
		// TODO: a future version of this should only drop and re-create cid_lookup and cid_cursor but not drop cid_log so everyone seeds the most up-to-date cid_log
		reseedDDL := `begin; truncate mediorum_migrations; drop table cid_lookup; drop table cid_cursor; drop table cid_log; commit;`
		mustExec(db, reseedDDL)
		mustExec(db, `insert into mediorum_migrations values ('reseeded', now()) on conflict do nothing`)
		os.Exit(0)
	}

	slog.Info("running migrations...")
	runMigration(db, cidLookupDDL)
	runMigration(db, delistStatusesDDL)

	// stagger re-seeding between 1-8hrs. TODO: safe to remove after everyone runs it once
	min := 60
	max := 60 * 8
	randomTime := time.Minute * time.Duration(rand.Intn(max-min+1)+min)
	slog.Info("checking if we need to schedule a re-seed...")
	var reseeded bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = 'reseeded'`).Scan(&reseeded)
	if reseeded {
		slog.Info("already re-seeded. not doing it again")
	} else {
		slog.Info("yep we need to re-seed. scheduling", "time", randomTime)
		time.AfterFunc(randomTime, func() {
			slog.Info("marking migrations table to re-seed after we restart...")
			mustExec(db, `insert into mediorum_migrations values ('reseeding', now()) on conflict do nothing`)
			os.Exit(0)
		})
	}
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
