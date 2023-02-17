package discovery

import (
	"expvar"
	"fmt"
	"log"
	"os/exec"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/server"
	"comms.audius.co/shared/peering"
	"github.com/nats-io/nats.go"
	"golang.org/x/sync/errgroup"
)

func DiscoveryMain() {
	discoveryConfig := config.GetDiscoveryConfig()
	config.Init(discoveryConfig.PeeringConfig.Keys, discoveryConfig.PeeringConfig.TestHost)

	// dial datasources in parallel
	g := errgroup.Group{}

	var jsc nats.JetStreamContext
	var proc *rpcz.RPCProcessor

	g.Go(func() error {
		peering := peering.New(&discoveryConfig.PeeringConfig)
		err := peering.PollRegisteredNodes()
		if err != nil {
			return err
		}

		peerMap := peering.Solicit()

		jsc, err = peering.DialJetstream(peerMap)
		if err != nil {
			log.Println("jetstream dial failed", err)
			return err
		}

		// create RPC processor
		proc, err = rpcz.NewProcessor(jsc)
		if err != nil {
			return err
		}

		err = pubkeystore.Dial(jsc)
		if err != nil {
			return err
		}

		return nil

	})
	g.Go(func() error {
		return db.Dial()
	})
	g.Go(func() error {
		out, err := exec.Command("dbmate",
			"--no-dump-schema",
			"--migrations-dir", "./discovery/db/migrations",
			"--url", db.MustGetAudiusDbUrl(),
			"up").CombinedOutput()
		fmt.Println("dbmate: ", string(out))
		return err
	})
	if err := g.Wait(); err != nil {
		log.Fatal(err)
	}

	expvar.NewString("booted_at").Set(time.Now().UTC().String())

	e := server.NewServer(jsc, proc)
	e.Logger.Fatal(e.Start(":8925"))
}
