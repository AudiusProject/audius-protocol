package db

import (
	"context"
	"log"
	"time"

	"comms.audius.co/trending/config"
	"github.com/ClickHouse/clickhouse-go/v2"
)

type ClickHouseDB struct {
	CHDB clickhouse.Conn
}

func NewClickHouseDB(conf config.Config) (*ClickHouseDB, error) {
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{conf.DatabaseAddress},
		Auth: clickhouse.Auth{
			Database: conf.DatabaseName,
			Username: conf.DatabaseUsername,
			Password: conf.DatabasePassword,
		},
		Debug: conf.Debug,
		Debugf: func(format string, v ...interface{}) {
			log.Println(format, v)
		},
		Settings: clickhouse.Settings{
			"max_execution_time": conf.MaxExecutionTime,
		},
		// TODO: move these to .env config
		DialTimeout:          time.Duration(10) * time.Second,
		MaxOpenConns:         5,
		MaxIdleConns:         5,
		ConnMaxLifetime:      time.Duration(10) * time.Minute,
		ConnOpenStrategy:     clickhouse.ConnOpenInOrder,
		BlockBufferSize:      10,
		MaxCompressionBuffer: 10240,
		ClientInfo: clickhouse.ClientInfo{ // optional, please see Client info section in the README.md
			Products: []struct {
				Name    string
				Version string
			}{
				{Name: "aud-trending-dev", Version: "0.1"},
			},
		},
	})

	if err != nil {
		return nil, err
	}

	err = conn.Ping(context.Background())
	if err != nil {
		return nil, err
	}

	return &ClickHouseDB{
		CHDB: conn,
	}, nil
}

func (ch ClickHouseDB) CheckHealth() bool {
	return nil == ch.CHDB.Ping(context.Background())
}

func (ch ClickHouseDB) QueryTrendingTracks() (string, error) {
	return "i checked and found nothing!", nil
}

func (ch ClickHouseDB) QueryTrendingPlaylists() (string, error) {
	return "i checked and also found nothing!", nil
}
