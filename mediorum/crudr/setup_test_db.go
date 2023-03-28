package crudr

import (
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func SetupTestDB() *gorm.DB {
	name := "test.db"
	os.Remove(name)
	db, err := gorm.Open(sqlite.Open(name), nil)
	if err != nil {
		panic(err)
	}
	return db
}
