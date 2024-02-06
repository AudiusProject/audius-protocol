package main

import (
	"context"
	"flag"
	"fmt"
	"ingester/crawler"
	"ingester/indexer"
	"ingester/parser"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	service := flag.String("service", "", "Specify the service to run: crawler, indexer, or parser")
	flag.Parse()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigChan
		fmt.Printf("Received signal: %v, shutting down...\n", sig)
		cancel()
	}()

	err := godotenv.Load("../.env")
	if err != nil {
		if os.IsNotExist(err) {
			log.Println("No .env file found, proceeding with existing environment variables")
		} else {
			log.Printf("Error loading .env file: %v\n", err)
		}
	}

	switch *service {
	case "crawler":
		go crawler.Run(ctx)
	case "indexer":
		go indexer.Run(ctx)
	case "parser":
		go parser.Run(ctx)
	default:
		fmt.Println("Unknown service: " + *service)
	}

	<-ctx.Done() // Wait until the context is canceled
	fmt.Println("Service stopped")
}
