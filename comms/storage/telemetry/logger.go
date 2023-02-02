package telemetry

import (
	"os"

	"github.com/rs/zerolog"
)

type Logger zerolog.Logger

func NewConsoleLogger() Logger {
	return Logger(zerolog.New(os.Stdout).With().Timestamp().Logger())
}

func (l Logger) Write(p []byte) (n int, err error) {
	return l.Write(p)
}
