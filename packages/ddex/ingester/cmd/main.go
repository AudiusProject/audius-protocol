package main

import (
	"flag"
	"fmt"
	"ingester/crawler"
	"ingester/indexer"
	"ingester/parser"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	service := flag.String("service", "", "Specify the service to run: crawler, indexer, or parser")
	flag.Parse()

	switch *service {
	case "crawler":
		crawler.Run()
	case "indexer":
		indexer.Run()
	case "parser":
		parser.Run()
	default:
		fmt.Println("Unknown service: " + *service)
		// sleep
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigChan
		fmt.Printf("Received signal: %v, shutting down...\n", sig)
	}
}
