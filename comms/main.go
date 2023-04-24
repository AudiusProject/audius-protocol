package main

import (
	"os"

	"comms.audius.co/cmd"
	"golang.org/x/exp/slog"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout))
	slog.SetDefault(logger)

	cmd.Execute()
}
