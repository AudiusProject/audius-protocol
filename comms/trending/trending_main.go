package trending

import (
	"log"
)

func TrendingMain() {
	conf := DefaultConfig()
	ts := NewTrendingServer()
	err := ts.Run(*conf)
	log.Fatal(err)
}
