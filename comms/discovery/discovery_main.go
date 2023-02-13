package discovery

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/server"
	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/nats-io/nats.go"
	"golang.org/x/sync/errgroup"
)

func DiscoveryMain() {
	config.Init()

	// dial datasources in parallel
	g := errgroup.Group{}

	var jsc nats.JetStreamContext
	var proc *rpcz.RPCProcessor

	g.Go(func() error {
		err := peering.PollRegisteredNodes(nil)
		if err != nil {
			return err
		}

		peerMap := peering.Solicit()

		jsc, err = peering.DialJetstream(peerMap)
		if err != nil {
			log.Println("jetstream dial failed", err)
			return err
		}

		// create streams
		err = createJetstreamStreams(jsc)
		if err != nil {
			return err
		}

		proc, err = rpcz.NewProcessor(jsc)
		if err != nil {
			return err
		}

		err = createConsumer(jsc, proc)
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
			"--url", os.Getenv("audius_db_url"),
			"up").CombinedOutput()
		fmt.Println("dbmate: ", string(out))
		return err
	})
	if err := g.Wait(); err != nil {
		startErrorServer(err)
		log.Fatal(err)
	}

	e := server.NewServer(jsc, proc)
	e.Logger.Fatal(e.Start(":8925"))
}

// this will start a simple server that will respond to all requests with the error message
// for 10 minutes, then container will exit and restart.
// for debugging, can be removed when everything works good
func startErrorServer(err error) {
	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	e.GET("*", func(c echo.Context) error {
		return c.String(500, err.Error())
	})

	go e.Logger.Fatal(e.Start(":8925"))
	time.Sleep(10 * time.Minute)
}

func createJetstreamStreams(jsc nats.JetStreamContext) error {

	streamInfo, err := jsc.AddStream(&nats.StreamConfig{
		Name:     config.GlobalStreamName,
		Subjects: []string{config.GlobalStreamSubject},
		Replicas: config.NatsReplicaCount,
		// DenyDelete: true,
		// DenyPurge:  true,
	})
	if err != nil {
		return err
	}

	config.Logger.Info("create stream", "strm", streamInfo)

	// create kv buckets
	_, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.PubkeystoreBucketName,
		Replicas: config.NatsReplicaCount,
	})
	if err != nil {
		return err
	}

	_, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.RateLimitRulesBucketName,
		Replicas: config.NatsReplicaCount,
	})
	if err != nil {
		return err
	}

	return nil
}

func createConsumer(jsc nats.JetStreamContext, proc *rpcz.RPCProcessor) error {

	// ------------------------------------------------------------------------------
	// TEMP: Subscribe to the subject for the demo
	// this is the "processor" for DM messages... which just inserts them into comm log table for now
	// it assumes that nats message has the signature header
	// but this is not the case for identity relay messages, for instance, which should have their own consumer
	// also, should be a pull consumer with explicit ack.
	// matrix-org/dendrite codebase has some nice examples to follow...

	sub, err := jsc.Subscribe(config.GlobalStreamSubject, proc.Apply, nats.Durable(config.WalletAddress))
	if err != nil {
		return err
	}

	info, err := sub.ConsumerInfo()

	if err == nil {
		config.Logger.Info("create subscription", "sub", info)
	}

	return err
}
