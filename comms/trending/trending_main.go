package trending

import (
	"context"

	"comms.audius.co/storage/telemetry"
)

func TrendingMain() {
	// trendingConfig.init()

	ctx := context.Background()
	logger := telemetry.NewConsoleLogger()
	tp := telemetry.InitTracing(logger)

	defer func() { _ = tp.Shutdown(ctx) }()

}
