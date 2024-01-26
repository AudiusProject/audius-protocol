package main

import (
	"flag"
	"ingester/crawler"
	"ingester/indexer"
	"ingester/parser"
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
		panic("unknown service: " + *service)
	}
}
