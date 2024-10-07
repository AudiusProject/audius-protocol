package crudr

import (
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func SetupTestDB() *gorm.DB {
	dsn := os.Getenv("dbUrl")
	if dsn == "" {
		dsn = "postgres://postgres:example@localhost:5454/mediorum_test"
	}
	db, err := gorm.Open(postgres.Open(dsn))
	if err != nil {
		panic(err)
	}

	db.Exec(`truncate ops`)

	return db
}
