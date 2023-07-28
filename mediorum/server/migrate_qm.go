package server

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) startQmCidMigration() {
	// Wait 1m after boot to start migration
	time.Sleep(time.Minute)

	logger := ss.logger.With("task", "migrate_qm")

	start := time.Now()

	if ss.Config.MigrateQmCids {
		// make sure the node has the legacy CN filesystem mounted
		if _, err := os.Stat("/file_storage/files"); err == nil {
			logger.Info("Qm CID migration starting")
		} else if os.IsNotExist(err) {
			logger.Error("Qm CID migration failed because legacy CN filesystem is not mounted")
			return
		} else {
			logger.Error("Qm CID migration failed because legacy CN filesystem is not mounted", "err", err)
			return
		}

		err := ss.migrateQmCids()
		took := time.Since(start)
		if err != nil {
			logger.Error("Qm CID migration failed", "err", err, "took_minutes", took.Minutes())
		} else {
			logger.Info("Qm CID migration successfully completed", "took_minutes", took.Minutes())
		}
	} else {
		logger.Info("Qm CID migration disabled")
	}
}

func (ss *MediorumServer) migrateQmCids() error {
	lastMultihash := ""

	for {
		ctx := context.Background()
		logger := ss.logger.With("task", "migrate_qm", "lastMultihash", lastMultihash)

		/* assumes unique fileUUID for each row. confirmed with:
		SELECT *
		FROM "Files"
		WHERE "fileUUID" IN (
				SELECT "fileUUID"
				FROM "Files"
				GROUP BY "fileUUID"
				HAVING COUNT("fileUUID") > 1
		)
		*/

		// note that fileUUID doesn't have an index, so we select+order by multihash and delete by fileUUID
		rows, err := ss.getUnmigratedRowsAfter(lastMultihash, 1000, ctx)
		if err != nil {
			logger.Error("error querying cid storage path", "err", err)
			continue
		}

		var fileUUIDsToDelete []string
		noRows := true
		for rows.Next() {
			// try to migrate the file 3 times and then skip
			// run the migration again later, and go to /internal/migrate_qm/all to see how many rows are left
			attempt := 1
			for {
				multihash, fileUUID, key, err := ss.migrateRow(rows)
				if err == nil {
					logger.Debug("migrated row", "key", key)
					noRows = false
					if fileUUID != "" {
						fileUUIDsToDelete = append(fileUUIDsToDelete, fileUUID)
					}

					// keep paginating
					if multihash != "" {
						lastMultihash = multihash
					}
					break
				} else {
					logger.Error("error migrating row", "err", err)
					if strings.Contains(err.Error(), "read-only file system") {
						err = fmt.Errorf("unable to migrate Qm CIDs due to read-only file system. last tried: %s", multihash)
						logger.Error("stopped Qm CID migration abruptly", "err", err)
						return err
					}
					attempt++
					if attempt > 3 {
						// keep paginating
						if multihash != "" {
							lastMultihash = multihash
						}
						break
					}
				}
			}
		}

		if err = rows.Err(); err != nil {
			logger.Error("error with rows.Next() or rows.Scan()", "err", err)
		}

		rows.Close()

		// delete all rows that we migrated
		if len(fileUUIDsToDelete) > 0 {
			_, err := ss.pgPool.Exec(ctx, `DELETE FROM "Files" WHERE "fileUUID" = ANY($1)`, fileUUIDsToDelete)
			if err != nil {
				logger.Error("error deleting rows", "err", err)
			}
		}

		// check if we've processed all rows
		if noRows {
			return nil
		}

		// be kind to the disk and db
		time.Sleep(time.Second * 10)
	}
}

func (ss *MediorumServer) migrateRow(rows pgx.Rows) (multihash, fileUUID, key string, err error) {
	var storagePath, dirMultihash, fileName, fileType sql.NullString
	err = rows.Scan(&storagePath, &multihash, &dirMultihash, &fileName, &fileUUID, &fileType)
	if err != nil {
		err = fmt.Errorf("error scanning row :%v", err)
		return
	}

	// if there's no file on disk, we have nothing to migrate
	diskPath := getDiskPathOnlyIfFileExists(storagePath.String, dirMultihash.String, multihash)
	if diskPath == "" {
		return
	}

	key = multihash
	if dirMultihash.Valid && dirMultihash.String != "" && fileName.Valid && fileName.String != "" {
		// for images, it's easier to not worry about having another upload object with a real variant, so just store the key to be the equivalent of :jobId/:variant
		key = dirMultihash.String + "/" + fileName.String
	}

	// copy to temp file, delete original file, and move temp file to our CDK bucket
	err = ss.moveFromDiskToMyBucket(diskPath, key, !fileType.Valid || fileType.String == "")
	if err != nil {
		err = fmt.Errorf("error moving file to bucket: %v", err)
		return
	}
	return
}

func (ss *MediorumServer) getUnmigratedRowsAfter(multihash string, pageSize int, ctx context.Context) (pgx.Rows, error) {
	baseSql := `SELECT "storagePath", "multihash", "dirMultihash", "fileName", "fileUUID", "type"
    FROM "Files"
    WHERE "type" IN ('copy320', 'image', 'null')`

	orderSql := `ORDER BY "multihash" ASC LIMIT $1`

	sql := baseSql + ` AND "multihash" >= $2 ` + orderSql
	return ss.pgPool.Query(ctx, sql, pageSize, multihash)
}

func (ss *MediorumServer) getNumUnmigratedRowsAfter(multihash string, ctx context.Context) (int, error) {
	baseSql := `SELECT COUNT(*)
    FROM "Files"
    WHERE "type" IN ('copy320', 'image', 'null') AND "multihash" >= $1`

	var numRows int
	err := ss.pgPool.QueryRow(ctx, baseSql, multihash).Scan(&numRows)
	return numRows, err
}

func (ss *MediorumServer) serveUnmigrated(c echo.Context) error {
	rows, err := ss.getUnmigratedRowsAfter(c.Param("multihash"), 1000, c.Request().Context())
	if err != nil {
		return err
	}
	defer rows.Close()

	var rowsJson []map[string]interface{}
	for rows.Next() {
		var (
			storagePath  sql.NullString
			multihash    sql.NullString
			dirMultihash sql.NullString
			fileName     sql.NullString
			fileUUID     sql.NullString
			fileType     sql.NullString
		)
		err := rows.Scan(&storagePath, &multihash, &dirMultihash, &fileName, &fileUUID, &fileType)
		if err != nil {
			return err
		}
		rowsJson = append(rowsJson, map[string]interface{}{
			"storagePath":  storagePath.String,
			"multihash":    multihash.String,
			"dirMultihash": dirMultihash.String,
			"fileName":     fileName.String,
			"fileUUID":     fileUUID.String,
			"type":         fileType.String,
		})
	}

	if err := rows.Err(); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, rowsJson)
}

func (ss *MediorumServer) serveCountUnmigrated(c echo.Context) error {
	count, err := ss.getNumUnmigratedRowsAfter(c.Param("multihash"), c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]int{
		"count": count,
	})
}
