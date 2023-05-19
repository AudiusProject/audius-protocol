package ddl

import (
	"database/sql"
	"fmt"
	"log"

	_ "embed"
)

//go:embed cid_lookup.sql
var cidLookupDDL string

func Migrate(db *sql.DB) {
	mustExec(db, cidLookupDDL)
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
	// fmt.Println("OK", ddl)
}
