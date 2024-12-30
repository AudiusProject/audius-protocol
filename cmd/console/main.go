package main

import (
	"log"

	"github.com/AudiusProject/audius-protocol/pkg/console"
)

func main() {
	if err := console.Run(); err != nil {
		log.Fatalf("console crashed: %v", err)
	}
}
