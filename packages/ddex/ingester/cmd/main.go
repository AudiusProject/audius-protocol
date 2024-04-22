package main

import (
	"context"
	"flag"
	"fmt"
	"ingester/crawler"
	"ingester/parser"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	service := flag.String("service", "", "Specify the service to run: crawler or parser")
	flag.Parse()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigChan
		log.Printf("Received signal: %v, shutting down...\n", sig)
		cancel()
	}()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{AddSource: true}))
	slog.SetDefault(logger)

	err := godotenv.Load("../.env")
	if err != nil {
		if os.IsNotExist(err) {
			log.Println("No .env file found, proceeding with existing environment variables")
		} else {
			log.Println("Error loading .env file:", err)
		}
	}

	switch *service {
	case "crawler":
		go crawler.RunNewCrawler(ctx)
	case "parser":
		go parser.RunNewParser(ctx)
	default:
		fmt.Println("Unknown service: " + *service)
	}

	<-ctx.Done() // Wait until the context is canceled
	log.Println("Service stopped")
}
