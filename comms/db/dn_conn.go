package db

import (
	"log"
	"net/url"
	"os"

	"comms.audius.co/config"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var (
	DNConn *sqlx.DB
)

func DNDial() error {
	var err error

	if DNConn != nil {
		return nil
	}

	dbUrlString := os.Getenv("dn_db_url")
	if dbUrlString == "" {
		log.Fatal("dn_db_url is required")
	}

	dbUrl, err := url.Parse(dbUrlString)
	if err != nil {
		log.Fatal("invalid db string: "+dbUrlString, "err", err)
	}

	logger := config.Logger.New("host", dbUrl.Host, "db", dbUrl.Path)

	DNConn, err = sqlx.Open("postgres", dbUrlString)
	if err != nil {
		logger.Crit("database.DNDial failed " + err.Error())
		return err
	}
	logger.Info("DN database dialed")

	return nil
}
