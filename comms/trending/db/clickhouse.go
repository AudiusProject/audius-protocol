package db

import (
	"comms.audius.co/trending/config"
	"github.com/ClickHouse/clickhouse-go/v2"
)

type ClickHouseDB struct {
	CHDB clickhouse.Conn
}

func NewClickHouseDB(conf config.Config) (*ClickHouseDB, error) {
	conn, err := clickhouse.Open(&clickhouse.Options{})

	if err != nil {
		return nil, err
	}

	return &ClickHouseDB{
		CHDB: conn,
	}, nil
}

func (ch ClickHouseDB) CheckHealth() bool {
	return true
}

func (ch ClickHouseDB) QueryTrendingTracks() (string, error) {
	return "i checked and found nothing!", nil
}

func (ch ClickHouseDB) QueryTrendingPlaylists() (string, error) {
	return "i checked and also found nothing!", nil
}
