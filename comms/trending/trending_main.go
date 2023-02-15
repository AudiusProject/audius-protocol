package trending

import (
	"log"

	"comms.audius.co/trending/config"
	"comms.audius.co/trending/trendingserver"
)

func TrendingMain() {
	conf, err := config.Default()
	if err != nil {
		log.Fatal(err)
	}

	ts, err := trendingserver.NewTrendingServer(*conf)
	if err != nil {
		log.Fatal(err)
	}

	err = ts.Run()
	log.Fatal(err)
}
