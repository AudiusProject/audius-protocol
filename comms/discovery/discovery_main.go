package discovery

import (
	"expvar"
	"log"
	"net/http"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/server"
	"comms.audius.co/shared/peering"
	"github.com/Doist/unfurlist"
	"github.com/nats-io/nats.go"
	"golang.org/x/sync/errgroup"
)

func DiscoveryMain() {
	// dial datasources in parallel
	g := errgroup.Group{}

	var jsc nats.JetStreamContext
	var proc *rpcz.RPCProcessor

	g.Go(func() error {
		discoveryConfig := config.GetDiscoveryConfig()
		peering, err := peering.New(&discoveryConfig.PeeringConfig)
		if err != nil {
			return err
		}

		err = peering.PollRegisteredNodes()
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
		return db.RunMigrations()
	})
	if err := g.Wait(); err != nil {
		log.Fatal(err)
	}

	expvar.NewString("booted_at").Set(time.Now().UTC().String())

	// Start unfurlist server on :8926 to unfurl urls
	config := unfurlist.WithBlocklistPrefixes(
		[]string{
			"http://localhost",
			"http://127",
			"http://10",
			"http://169.254",
			"http://172.16",
			"http://192.168",
			"http://::1",
			"http://fe80::",
		},
	)
	http.Handle("/comms/unfurl", unfurlist.New(config))
	go http.ListenAndServe(":8926", nil)

	// Start comms server on :8925
	e := server.NewServer(jsc, proc)
	e.Logger.Fatal(e.Start(":8925"))
}
