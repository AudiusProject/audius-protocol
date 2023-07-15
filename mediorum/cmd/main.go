package main

import (
	"flag"
	"fmt"
	"mediorum/cmd/loadtest"
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

	// this has been named `test` as ci passes `test` as an arg to all services
	loadtestCmd := flag.NewFlagSet("test", flag.ExitOnError)
	loadtestNum := loadtestCmd.Int("num", 10, "number of uploads")

	metricsCmd := flag.NewFlagSet("metrics", flag.ExitOnError)

	if len(os.Args) < 2 {
		fmt.Println("expected 'test' or 'metrics' subcommands")
		os.Exit(1)
	}

	testClient := initClient()

	switch os.Args[1] {

	case "test":
		loadtestCmd.Parse(os.Args[2:])
		loadtest.Run(testClient, *loadtestNum)
	case "metrics":
		metricsCmd.Parse(os.Args[2:])
		loadtest.RunM(testClient)
	default:
		fmt.Println("expected 'test' or 'metrics' subcommands")
		os.Exit(1)
	}
}
