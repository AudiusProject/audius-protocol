package server

import (
	"context"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5"
)

func (ss *MediorumServer) startQmCidMigration() {
	// Wait 1m after boot to start repair
	time.Sleep(time.Minute)

	logger := ss.logger.With("task", "migrate_qm")

	// Repeat the migration process every minute in case new uploads legacy came in (they shouldn't).
	// Subsequent runs should be very fast since the migration deletes rows from Files after adding them to the bucket and inserting a row into the blobs table.
	for {
		start := time.Now()

		// TODO: It would be nice if this could be an optimizely flag
		if ss.Config.MigrateQmCids {
			logger.Info("Qm CID migration starting")
			err := ss.migrateQmCids()
			took := time.Since(start)
			if err != nil {
				logger.Error("Qm CID migration failed", "err", err, "took", took)
			} else {
				logger.Info("Qm CID migration OK", "took", took)
			}
		} else {
			logger.Info("Qm CID migration disabled")
		}

		logger.Info("Qm CID migration sleeping", "sleep", time.Minute)
		time.Sleep(time.Minute)
	}
}

func (ss *MediorumServer) migrateQmCids() error {
	pageSize := 100
	var lastCreatedAt time.Time

	for {
		ctx := context.Background()
		logger := ss.logger.With("task", "migrate_qm", "lastCreatedAt", lastCreatedAt)

		/* assumes unique fileUUID for each row - check with:
		SELECT *
		FROM "Files"
		WHERE "fileUUID" IN (
				SELECT "fileUUID"
				FROM "Files"
				GROUP BY "fileUUID"
				HAVING COUNT("fileUUID") > 1
		)
		*/

		// note that fileUUID doesn't have an index, so we select by createdAt and delete by fileUUID
		baseSql := `SELECT "storagePath", "multihash", "dirMultihash", "fileName", "fileUUID", "createdAt"
    FROM "Files"
    WHERE "type" IN ('copy320', 'image')`

		orderSql := `ORDER BY "createdAt" ASC LIMIT $1`

		var rows pgx.Rows
		var err error

		if !lastCreatedAt.IsZero() {
			sql := baseSql + ` AND "createdAt" > $2 ` + orderSql
			rows, err = ss.pgPool.Query(ctx, sql, pageSize, lastCreatedAt)
		} else {
			sql := baseSql + orderSql
			rows, err = ss.pgPool.Query(ctx, sql, pageSize)
		}
		if err != nil {
			logger.Error("error querying cid storage path", "err", err)
			continue
		}

		var fileUUIDs []string
		var noRows bool = true
		for rows.Next() {
			noRows = false
			var storagePath, multihash, dirMultihash, fileName, fileUUID string
			var createdAt time.Time
			err = rows.Scan(&storagePath, &multihash, &dirMultihash, &fileName, &fileUUID, &createdAt)
			if err != nil {
				logger.Error("error scanning row", "err", err)
				return err
			}

			fileUUIDs = append(fileUUIDs, fileUUID)

			diskPath := storagePath
			if _, err := os.Stat(diskPath); os.IsNotExist(err) {
				// look for the file under the legacy and custom paths (see creator-node/fsutils.ts)
				if dirMultihash != "" {
					diskPath = computeFilePathInDir(dirMultihash, multihash)
				}
				if _, err := os.Stat(diskPath); os.IsNotExist(err) {
					diskPath = computeFilePath(multihash)
					if _, err := os.Stat(diskPath); os.IsNotExist(err) {
						diskPath = computeLegacyFilePath(multihash)
					}
				}
			}

			// for images, it's easier to not worry about having another upload object with a real variant, so just store the key to be the equivalent of :jobId/:variant
			key := multihash
			if fileName != "" {
				key = dirMultihash + "/" + fileName
			}

			// copy to temp file, delete original file, and move temp file to our CDK bucket
			err = ss.moveFromDiskToMyBucket(diskPath, key)
			if err != nil {
				logger.Error("error moving file to bucket", "err", err)
				return err
			}

			// set the last processed multihash
			lastCreatedAt = createdAt
		}

		rows.Close()

		// delete all rows that we migrated
		if len(fileUUIDs) > 0 {
			_, err := ss.pgPool.Exec(ctx, `DELETE FROM "Files" WHERE "fileUUID" = ANY($1)`, fileUUIDs)
			if err != nil {
				logger.Error("error deleting rows", "err", err)
				return err
			}
		}

		// check if we've processed all rows
		if noRows {
			return nil
		}

		// sleep to avoid overloading the database
		time.Sleep(time.Minute * 10)
	}
}

const storagePath string = "/file_storage"

func computeLegacyFilePath(cid string) string {
	return filepath.Join(storagePath, cid)
}

func computeFilePathInDir(dirName string, cid string) string {
	parentDirPath := computeFilePath(dirName)
	return filepath.Join(parentDirPath, cid)
}

func computeFilePath(cid string) string {
	storageLocationForCid := getStorageLocationForCID(cid)
	return filepath.Join(storageLocationForCid, cid)
}

func getStorageLocationForCID(cid string) string {
	directoryID := cid[len(cid)-4 : len(cid)-1]
	storageLocationForCid := filepath.Join(
		storagePath,
		"files",
		directoryID,
	)
	return storageLocationForCid
}
