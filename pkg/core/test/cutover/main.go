package main

import "log"

func run() error {
	// audius-cmd create-user (return as json)
	// audius-cmd create-track (return as json)

	// GET /stream url while indexing from solana

	// GET /track, play count should be 1
	// validate tx on solana
	// validate tx on core

	// wait until cutover or do more listens until cutover

	// GET /stream after cutover
	// assert play count increments as expected
	// validate tx on core works

	// maybe assert some rewards / challenges are hit. query db?

	return nil
}

func main() {
	if err := run(); err != nil {
		log.Fatalf("cutover test failed: %v", err)
	}
}
