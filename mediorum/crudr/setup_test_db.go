package crudr

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func SetupTestDB() *gorm.DB {
	dsn := "postgres://postgres:example@localhost:5444/mediorum_test"
	db, err := gorm.Open(postgres.Open(dsn))
	if err != nil {
		panic(err)
	}

	db.Exec(`truncate ops`)

	return db
}
