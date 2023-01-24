package db

import (
	"log"
	"net/url"
	"os"
	"strings"

	"comms.audius.co/discovery/config"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var (
	Conn *sqlx.DB
)

func Dial() error {
	var err error

	if Conn != nil {
		return nil
	}

	dbUrlString := os.Getenv("audius_db_url")
	if dbUrlString == "" {
		log.Fatal("audius_db_url is required")
	}

	dbUrl, err := url.Parse(dbUrlString)
	if err != nil {
		log.Fatal("invalid db string: "+dbUrlString, "err", err)
	}

	logger := config.Logger.New("host", dbUrl.Host, "db", dbUrl.Path)

	// todo: should this be dev only?
	if !strings.HasSuffix(dbUrlString, "?sslmode=disable") {
		dbUrlString += "?sslmode=disable"
	}

	Conn, err = sqlx.Open("postgres", dbUrlString)
	if err != nil {
		logger.Crit("database.Dial failed " + err.Error())
		return err
	}
	logger.Info("database dialed")

	return nil
}
