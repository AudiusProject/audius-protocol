package discovery

import (
	"fmt"
	"log"
	"os"
	"os/exec"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/jetstream"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/server"
	"comms.audius.co/shared/peering"
	"golang.org/x/sync/errgroup"
)

func DiscoveryMain() {
	config.Init()

	// dial datasources in parallel
	g := errgroup.Group{}

	g.Go(func() error {
		// this should be coniditional
		// if NATS_URL is specified...
		// don't bother
		err := peering.PollDiscoveryProviders()
		if err != nil {
			return err
		}
		peerMap := peering.Solicit()
		return jetstream.Dial(peerMap)

	})
	g.Go(func() error {
		return db.Dial()
	})
	g.Go(func() error {
		return pubkeystore.Dial()
	})
	g.Go(func() error {
		out, err := exec.Command("dbmate",
			"--no-dump-schema",
			"--migrations-dir", "./discovery/db/migrations",
			"--url", os.Getenv("audius_db_url"),
			"up").CombinedOutput()
		fmt.Println("dbmate: ", string(out))
		return err
	})
	if err := g.Wait(); err != nil {
		log.Fatal(err)
	}

	e := server.NewServer()
	e.Logger.Fatal(e.Start(":8925"))
}
