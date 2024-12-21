package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/AudiusProject/audius-protocol/pkg/core"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
)

func main() {
	var slogLevel slog.Level
	if logLevel := os.Getenv("audiusd_log_level"); logLevel != "" {
		switch logLevel {
		case "debug":
			slogLevel = slog.LevelDebug
		case "info":
			slogLevel = slog.LevelInfo
		case "warn":
			slogLevel = slog.LevelWarn
		case "error":
			slogLevel = slog.LevelError
		default:
			slogLevel = slog.LevelWarn
		}
	} else {
		slogLevel = slog.LevelInfo
	}

	logger := common.NewLogger(&slog.HandlerOptions{
		Level: slogLevel,
	})
	ctx := context.Background()

	if err := core.Run(ctx, logger); err != nil {
		logger.Errorf("fatal core error: %v", err)
	}
}
