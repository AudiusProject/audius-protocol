package ddl

import (
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"

	_ "embed"
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
	runMigration(db, cidLookupDDL)
	runMigration(db, delistStatusesDDL)

	// stagger re-seeding between 1-3hrs. TODO: safe to remove after everyone runs it once
	// min := time.Duration(60)
	// max := time.Duration(180)
	// diff := max.Minutes() - min.Minutes()
	// randomTime := min + time.Duration(rand.Float64()*diff)*time.Minute
	// time.AfterFunc(randomTime, func() {
	// 	fmt.Println("dropping tables and re-seeding...")
	// 	ddl := `begin; truncate mediorum_migrations; drop table cid_lookup; drop table cid_cursor; drop table cid_log; commit;`
	// 	h := md5string(ddl)
	// 	var alreadyRan bool
	// 	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1`, h).Scan(&alreadyRan)
	// 	if alreadyRan {
	// 		fmt.Printf("re-seed hash %s exists skipping ddl \n", h)
	// 		return
	// 	}

	// 	mustExec(db, ddl)
	// 	mustExec(db, `insert into mediorum_migrations values ($1, now()) on conflict do nothing`, h)
	// 	os.Exit(0)
	// })
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
