package db

import (
	"fmt"
	"os/exec"
)

func RunMigrations() error {
	out, err := exec.Command("dbmate",
		"--no-dump-schema",
		"--migrations-dir", "./discovery/db/migrations",
		"--url", MustGetAudiusDbUrl(),
		"up").CombinedOutput()
	fmt.Println("dbmate: ", string(out))
	return err
}
