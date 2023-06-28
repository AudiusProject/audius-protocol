package db

import (
	"log"
	"net/url"
	"os"
	"strings"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"golang.org/x/exp/slog"
)

var (
	Conn *sqlx.DB
)

func MustGetAudiusDbUrl() string {
	dbUrlString := os.Getenv("audius_db_url")
	if dbUrlString == "" {
		log.Fatal("audius_db_url is required")
	}

	if !strings.HasSuffix(dbUrlString, "?sslmode=disable") {
		dbUrlString += "?sslmode=disable"
	}

	return dbUrlString
}

func Dial() error {
	var err error

	if Conn != nil {
		return nil
	}

	dsn := MustGetAudiusDbUrl()

	dbUrl, err := url.Parse(dsn)
	if err != nil {
		log.Fatal("invalid db string: "+dsn, "err", err)
	}

	logger := slog.With("host", dbUrl.Host, "db", dbUrl.Path)

	Conn, err = sqlx.Open("postgres", dsn)
	if err != nil {
		logger.Error("database.Dial failed", "err", err)
		return err
	}
	logger.Info("database dialed")

	Conn.SetMaxOpenConns(10)

	return nil
}
