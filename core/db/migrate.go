package db

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"embed"

	"github.com/AudiusProject/audius-protocol/core/common"
	migrate "github.com/rubenv/sql-migrate"
)

//go:embed sql/migrations/*
var migrationsFS embed.FS

//go:embed sql/post_sync_migrations/*
var postSyncMigrationsFS embed.FS

func RunMigrations(logger *common.Logger, pgConnectionString string, downFirst, postSync bool) error {
	tries := 10
	db, err := sql.Open("postgres", pgConnectionString)
	if err != nil {
		return fmt.Errorf("error opening sql db %v", err)
	}
	defer db.Close()
	for {
		if tries < 0 {
			return errors.New("ran out of retries for migrations")
		}
		err = db.Ping()
		if err != nil {
			logger.Errorf("could not ping postgres %v", err)
			tries = tries - 1
			time.Sleep(2 * time.Second)
			continue
		}
		if postSync {
			err := runPostSyncMigrations(logger, db, downFirst)
			if err != nil {
				logger.Error("issue running post sync migrations", "error", err, "tries_left", tries)
				return fmt.Errorf("can't run post sync migrations %v", err)
			}
		} else {
			err := runMigrations(logger, db, downFirst)
			if err != nil {
				logger.Error("issue running migrations", "error", err, "tries_left", tries)
				return fmt.Errorf("can't run migrations %v", err)
			}
		}
		return nil
	}
}

func runMigrations(logger *common.Logger, db *sql.DB, downFirst bool) error {
	migrations := migrate.EmbedFileSystemMigrationSource{
		FileSystem: migrationsFS,
		Root:       "sql/migrations",
	}

	migrate.SetTable("core_db_migrations")

	if downFirst {
		logger.Info("running down migrations")
		_, err := migrate.Exec(db, "postgres", migrations, migrate.Down)
		if err != nil {
			return fmt.Errorf("error running down migrations %v", err)
		}
	}

	n, err := migrate.Exec(db, "postgres", migrations, migrate.Up)
	if err != nil {
		return fmt.Errorf("error running migrations %v", err)
	}

	logger.Infof("Applied %d successful migrations!", n)

	return nil
}

func runPostSyncMigrations(logger *common.Logger, db *sql.DB, downFirst bool) error {
	migrations := migrate.EmbedFileSystemMigrationSource{
		FileSystem: migrationsFS,
		Root:       "sql/migrations",
	}

	migrate.SetTable("core_post_sync_db_migrations")

	if downFirst {
		logger.Info("running down migrations")
		_, err := migrate.Exec(db, "postgres", migrations, migrate.Down)
		if err != nil {
			return fmt.Errorf("error running down migrations %v", err)
		}
	}

	n, err := migrate.Exec(db, "postgres", migrations, migrate.Up)
	if err != nil {
		return fmt.Errorf("error running migrations %v", err)
	}

	logger.Infof("Applied %d successful migrations!", n)

	return nil
}
