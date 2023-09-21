package db

import (
	"fmt"
	"os"
	"os/exec"
)

func RunMigrations() error {
	cmd := exec.Command("sh", "pg_migrate.sh")

	// n.b. this won't work in docker-land
	cmd.Dir = "../discovery/ddl"

	cmd.Env = append(os.Environ(),
		"DB_URL="+MustGetAudiusDbUrl(),
	)

	out, err := cmd.CombinedOutput()
	fmt.Println("pg_migrate.sh: ", string(out))
	return err
}
