package telemetry

import (
	"os"

	"github.com/rs/zerolog"
)

func NewConsoleLogger() zerolog.Logger {
	return zerolog.New(os.Stdout).With().Timestamp().Caller().Logger()
}
