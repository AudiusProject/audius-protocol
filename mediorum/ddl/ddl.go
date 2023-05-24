package ddl

import (
	"database/sql"
	"fmt"
	"log"

	_ "embed"
)

//go:embed cid_lookup.sql
var cidLookupDDL string

//go:embed delist_statuses.sql
var delistStatusesDDL string

func Migrate(db *sql.DB) {
	mustExec(db, cidLookupDDL)
	mustExec(db, delistStatusesDDL)

	// flare-178: disable cid beam
	// clear out existing data
	log.Println("truncate cid tables... ")
	_, err := db.Exec(`
	drop trigger if exists handle_cid_change on "Files";
	truncate table cid_cursor cascade;
	truncate table cid_log cascade;
	truncate table cid_lookup cascade;
	drop table if exists cid_temp;
	`)
	if err != nil {
		log.Fatal("truncate cid failed", err)
	} else {
		log.Println("truncate cid ok")
	}
}

func mustExec(db *sql.DB, ddl string) {

	// this is a hack to skip running ddl if the index exists...
	// since ddl can block for several minutes
	// pg_migrate.sh soon
	q := `select count(*) = 1 from pg_indexes where indexname = 'idx_cid_log_updated_at'`
	var indexExists bool
	db.QueryRow(q).Scan(&indexExists)
	if indexExists {
		fmt.Println("indexExists... skipping ddl")
		return
	}

	_, err := db.Exec(ddl)
	if err != nil {
		fmt.Println(ddl)
		log.Fatal(err)
	}
}
