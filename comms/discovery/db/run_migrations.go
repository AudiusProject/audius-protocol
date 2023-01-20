package db

import (
	"fmt"
	"os"
	"os/exec"
)

func RunMigrations() error {
	out, err := exec.Command("dbmate",
		"--no-dump-schema",
		"--migrations-dir", "./discovery/db/migrations",
		"--url", os.Getenv("audius_db_url"),
		"up").CombinedOutput()
	fmt.Println("dbmate: ", string(out))
	return err
}
