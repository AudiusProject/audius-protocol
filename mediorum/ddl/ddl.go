package ddl

import (
	"database/sql"
	"fmt"
	"log"

	_ "embed"
)

//go:embed files_trigger.sql
var filesTrigger string

func Migrate(db *sql.DB) {
	mustExec(db, filesTrigger)
}

func mustExec(db *sql.DB, ddl string) {
	_, err := db.Exec(ddl)
	if err != nil {
		fmt.Println(ddl)
		log.Fatal(err)
	}
	// fmt.Println("OK", ddl)
}
