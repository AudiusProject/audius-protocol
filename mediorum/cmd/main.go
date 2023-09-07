// 1

package main

import (
	"flag"
	"fmt"
	"log"
	"mediorum/cmd/loadtest"
	"mediorum/cmd/reaper"
	"mediorum/cmd/segments"
	"mediorum/registrar"
	"mediorum/server"
	"os"
	"strconv"
)

func getenvWithDefault(key string, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}

func initClient() *loadtest.TestClient {
	registeredPeers := []server.Peer{}
	var err error

	switch env := os.Getenv("MEDIORUM_ENV"); env {
	case "prod":
		g := registrar.NewAudiusApiGatewayProd()
		registeredPeers, err = g.Peers()
		if err != nil {
			panic(err)
		}
	case "stage":
		g := registrar.NewAudiusApiGatewayStaging()
		registeredPeers, err = g.Peers()
		if err != nil {
			panic(err)
		}
	default:
		hostNameTemplate := getenvWithDefault("hostNameTemplate", "http://localhost:199%d")
		devNetworkCount, _ := strconv.Atoi(getenvWithDefault("devNetworkCount", "3"))
		registeredPeers = []server.Peer{}

		for i := 1; i <= devNetworkCount; i++ {
			registeredPeers = append(registeredPeers, server.Peer{Host: fmt.Sprintf(hostNameTemplate, i)})
		}

	}
	testClient := loadtest.NewTestClient(registeredPeers)
	return testClient
}

func main() {

	if len(os.Args) < 2 {
		log.Fatal("usage `$ mediorum-cmd <test [num]|metrics|segments>`")
	}

	switch os.Args[1] {
	case "test":
		// this has been named `test` as ci passes `test` as an arg to all services
		loadtestCmd := flag.NewFlagSet("test", flag.ExitOnError)
		loadtestCmdNum := loadtestCmd.Int("num", 10, "number of uploads")
		loadtestCmd.Parse(os.Args[2:])
		testClient := initClient()
		loadtest.Run(testClient, *loadtestCmdNum)
	case "metrics":
		metricsCmd := flag.NewFlagSet("metrics", flag.ExitOnError)
		metricsCmd.Parse(os.Args[2:])
		testClient := initClient()
		loadtest.RunM(testClient)
	case "segments":
		segmentsCmd := flag.NewFlagSet("segments", flag.ExitOnError)
		segmentsCmdDelete := segmentsCmd.Bool("delete", false, "Delete files and corresponding database rows if set to true")
		segmentsCmd.Parse(os.Args[2:])

		c := &segments.MediorumClientConfig{
			Delete: *segmentsCmdDelete,
		}

		segments.Run(c)
	case "reaper":
		reaper.Run()
	default:
		log.Fatal("usage `$ mediorum-cmd <test [num]|metrics|segments|reaper>`")
	}
}
