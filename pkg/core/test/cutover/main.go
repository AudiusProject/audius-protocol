package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"

	"github.com/jaswdr/faker"
)

func runCmd(name string, arg ...string) error {
	cmd := exec.Command(name, arg...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func run() error {
	skipAudiusCompose := flag.Bool("skip-audius-compose", false, "Skip audius-compose calls, may affect test success")
	flag.Parse()

	if !*skipAudiusCompose {
		// audius-compose down
		err := runCmd("audius-compose", "down")
		if err != nil {
			return fmt.Errorf("could not tear down audius-compose env: %v", err)
		}

		// audius-compose up
		err = runCmd("audius-compose", "up")
		if err != nil {
			return fmt.Errorf("could not stand up audius-compose env: %v", err)
		}
	}

	f := faker.New()

	// audius-cmd create-user (return as json)
	username := f.Person().FirstName() + f.Person().LastName()
	userFile := fmt.Sprintf("audius-cmd-%s.json", username)
	defer runCmd("rm", "/tmp/"+userFile)

	err := runCmd("audius-cmd", "create-user", username, "--output", "/tmp/"+userFile)
	if err != nil {
		return fmt.Errorf("could not create user: %v", err)
	}

	// audius-cmd create-track (return as json)

	// GET /stream url while indexing from solana

	// GET /track, play count should be 1
	// validate tx on solana
	// validate tx on core

	// wait until cutover or do more listens until cutover

	// GET /stream after cutover
	// assert play count increments as expected
	// validate tx on core works

	// maybe assert some rewards / challenges are hit. query db?

	return nil
}

func main() {
	if err := run(); err != nil {
		log.Fatalf("cutover test failed: %v", err)
	}
}
