package main

import (
	"flag"
	"fmt"
	"log"
	"mediorum/cmd/loadtest"
	"mediorum/cmd/reaper"
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
		log.Fatal("usage `$ mediorum-cmd <test [num]|metrics|reaper>`")
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
		loadtest.RunMain(testClient)
	case "reaper":
		reaperCmd := flag.NewFlagSet("reaper", flag.ExitOnError)
		moveFiles := reaperCmd.Bool("move", false, "move files (default false)")
		logDir := reaperCmd.String("logDir", "/tmp/reaper/logs", "directory to store job logs (default: /tmp/reaper/logs)")
		moveDir := reaperCmd.String("moveDir", "/tmp/reaper/to_delete", "directory to move files staged for deletion (default: /tmp/reaper/to_delete)")
		walkDir := reaperCmd.String("walkDir", "/tmp/reaper/to_walk", "directory to walk (default: /tmp/reaper/to_walk)")
		reaperCmd.Parse(os.Args[2:])

		config := reaper.Config{
			MoveFiles: *moveFiles,
			MoveDir:   *moveDir,
			WalkDir:   *walkDir,
			LogDir:    *logDir,
		}
		reaper.RunMain(config)
	default:
		log.Fatal("usage `$ mediorum-cmd <test [num]|metrics|reaper>`")
	}
}
