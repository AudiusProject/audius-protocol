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
}

func mustExec(db *sql.DB, ddl string) {
	_, err := db.Exec(ddl)
	if err != nil {
		fmt.Println(ddl)
		log.Fatal(err)
	}
}
