package trending

import (
	"log"

	"comms.audius.co/trending/config"
)

func TrendingMain() {
	conf := config.DefaultConfig()

	ts, err := NewTrendingServer(*conf)
	if err != nil {
		log.Fatal(err)
	}

	err = ts.Run()
	log.Fatal(err)
}
