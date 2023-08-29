package ddl

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"mediorum/cidutil"
	"mediorum/crudr"
	"os"
	"strings"
	"sync"
	"time"

	_ "embed"

	"gocloud.dev/blob"
	"golang.org/x/exp/slog"
	"gorm.io/gorm"
)

//go:embed delist_statuses.sql
var delistStatusesDDL string

//go:embed clean_up_unfindable_cids.sql
var cleanUpUnfindableCIDsDDL string

var mediorumMigrationTable = `
	create table if not exists mediorum_migrations (
		"hash" text primary key,
		"ts" timestamp
	);
`

// TODO: Remove after every node runs the ops partition migration
var partition_ops_scheduled = "partition_ops_scheduled"
var partition_ops_completed = "partitioned_ops"

func Migrate(db *sql.DB, gormDB *gorm.DB, bucket *blob.Bucket) {
	mustExec(db, mediorumMigrationTable)

	migratePartitionOps(db, gormDB) // TODO: Remove after every node runs this
	runMigration(db, delistStatusesDDL)
	runMigration(db, cleanUpUnfindableCIDsDDL) // TODO: Remove after every node runs this
	// TODO: remove after this ran once on every node (when every node is >= v0.4.2)
	migrateShardBucket(db, bucket)

	schedulePartitionOpsMigration(db) // TODO: Remove after every node runs the partition ops migration
}

func runMigration(db *sql.DB, ddl string) {
	h := md5string(ddl)

	var alreadyRan bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1`, h).Scan(&alreadyRan)
	if alreadyRan {
		fmt.Printf("hash %s exists skipping ddl \n", h)
		return
	}

	mustExec(db, ddl)
	mustExec(db, `insert into mediorum_migrations values ($1, now()) on conflict do nothing`, h)
}

func mustExec(db *sql.DB, ddl string, va ...interface{}) {
	_, err := db.Exec(ddl, va...)
	if err != nil {
		fmt.Println(ddl)
		log.Fatal(err)
	}
}

func md5string(s string) string {
	hash := md5.Sum([]byte(s))
	return hex.EncodeToString(hash[:])
}

func schedulePartitionOpsMigration(db *sql.DB) {
	// stagger between 0-12hrs
	// max := 60 * 12
	// randomTime := time.Minute * time.Duration(rand.Intn(max+1))
	randomTime := time.Minute * time.Duration(0)
	slog.Info("checking if we need to schedule the partition ops migration...")
	var partitioned bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1`, partition_ops_completed).Scan(&partitioned)
	if partitioned {
		slog.Info("already partitioned ops, skipping migration scheduling")
	} else {
		slog.Info("scheduling partition ops migration", "time", randomTime)
		time.AfterFunc(randomTime, func() {
			slog.Info("marking migrations table to partition ops after we restart...")
			mustExec(db, `insert into mediorum_migrations values ($1, now()) on conflict do nothing`, partition_ops_scheduled)
			os.Exit(0)
		})
	}
}

func migratePartitionOps(db *sql.DB, gormDB *gorm.DB) {
	slog.Info("checking if it's time to partition ops...")
	var scheduled bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1;`, partition_ops_scheduled).Scan(&scheduled)
	if !scheduled {
		slog.Info("partition ops migration not scheduled, skipping ddl")
		return
	}

	logfileName := "partition_ops.txt"

	logAndWriteToFile(fmt.Sprint("starting partitioning of ops"), logfileName)
	start := time.Now()

	mustExec(
		db,
		`BEGIN;

		-- Kill all long-running sql queries
		SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '1 minute';

		DO $$ 
		BEGIN
				IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'old_ops') THEN
						ALTER TABLE IF EXISTS ops RENAME TO old_ops;
				END IF;
		END $$;

		-- Create the new ops parent table
		CREATE TABLE IF NOT EXISTS ops (
			"ulid" TEXT,
			"host" TEXT,
			"action" TEXT,
			"table" TEXT,
			"data" JSONB)
			PARTITION BY HASH ("host");

		DO $$ 
		DECLARE 
			i INTEGER;
			partition_name TEXT;
		BEGIN 
			FOR i IN 0..1008 LOOP -- 1009 partitions
				partition_name := 'ops_' || i;
				EXECUTE 'CREATE TABLE IF NOT EXISTS ' || partition_name || ' PARTITION OF ops FOR VALUES WITH (MODULUS 1009, REMAINDER ' || i || ');';

        BEGIN
					EXECUTE 'ALTER TABLE ' || partition_name || ' ADD PRIMARY KEY ("ulid");';
					EXCEPTION WHEN invalid_table_definition THEN NULL;
				END;

			END LOOP; 
		END $$;

		COMMIT;`,
	)

	err := migrateOpsData(db, gormDB, logfileName)
	if err != nil {
		logAndWriteToFile(err.Error(), logfileName)
		log.Fatal(err)
	}

	ctx := context.Background()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		logAndWriteToFile(err.Error(), logfileName)
		log.Fatal(err)
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(
		ctx,
		`DROP TABLE old_ops;`,
	)
	_, err = tx.ExecContext(
		ctx,
		`INSERT INTO mediorum_migrations VALUES ($1, now()) ON CONFLICT DO NOTHING;`,
		partition_ops_completed,
	)
	if err != nil {
		logAndWriteToFile(err.Error(), logfileName)
		log.Fatal(err)
	}
	if err = tx.Commit(); err != nil {
		logAndWriteToFile(err.Error(), logfileName)
		log.Fatal(err)
	}

	logAndWriteToFile(fmt.Sprintf("finished partitioning ops. took %gm\n", time.Since(start).Minutes()), logfileName)
}

// copy data from old_ops to ops
func migrateOpsData(db *sql.DB, gormDB *gorm.DB, logfileName string) error {
	logAndWriteToFile(fmt.Sprintln("starting ops data migration"), logfileName)
	lastULID := ""
	pageSize := 3000
	rowsMigrated := 0
	tmpFile := "/tmp/mediorum/ops_migration.csv"

	for {
		var ops []crudr.Op

		// select a batch of rows starting from the lastULID
		err := gormDB.Table("old_ops").Where("ulid > ?", lastULID).Order("ulid asc").Limit(pageSize).Find(&ops).Error
		if err != nil {
			return err
		}

		if len(ops) == 0 {
			// we've migrated all rows
			_, err := os.Stat(tmpFile)
			if err == nil {
				err = os.Remove(tmpFile)
				if err != nil {
					slog.Error(fmt.Sprintf("Error removing temp file %s", tmpFile), "err", err)
				}
			}
			logAndWriteToFile(fmt.Sprintf("successfully migrated %d ops rows\n", rowsMigrated), logfileName)
			return nil
		}

		writeOpsToTempFile(ops)
		mustExec(db, `COPY ops("ulid", "host", "action", "table", "data") FROM $1 WITH (DELIMITER ',', HEADER true)`, tmpFile)

		// mustExec(
		// 	db,
		// 	`INSERT INTO ops ("ulid", "host", "action", "table", "data")
		// 	VALUES `+constructOpsBulkInsertValuesString(ops)+`
		// 	ON CONFLICT DO NOTHING`,
		// 	ops,
		// )
		rowsMigrated += len(ops)
		lastULID = ops[len(ops)-1].ULID

		// delete all rows that we migrated
		mustExec(db, `DELETE FROM old_ops WHERE ulid <= $1;`, lastULID)

		// keep paginating
		time.Sleep(time.Millisecond * 100)
	}
}

func writeOpsToTempFile(ops []crudr.Op) {
	dir := "/tmp/mediorum"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.Mkdir(dir, 0755)
	}
	file := "/tmp/mediorum/ops_migration.csv"
	f, err := os.OpenFile(file, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		log.Fatalf("Failed to open file %s: %v", file, err)
	}
	defer f.Close()

	rows := "ulid,host,action,table,data\n"
	for i, op := range ops {
		rows += op.ULID + "," + op.Host + "," + op.Action + "," + op.Table + "," + string(op.Data)
		if i < len(ops)-1 {
			rows += "\n"
		}
	}

	if _, err := f.WriteString(rows); err != nil {
		log.Fatalf("Failed to write to file %s: %v", file, err)
	}

	f.Sync()
}

func constructOpsBulkInsertValuesString(ops []crudr.Op) string {
	values := ""
	for i, op := range ops {
		values += "('" + op.ULID + "', '" + op.Host + "', '" + op.Action + "', '" + op.Table + "', '" + string(op.Data) + "')"
		if i < len(ops)-1 {
			values += ", "
		}
	}
	return values
}

func migrateShardBucket(db *sql.DB, bucket *blob.Bucket) {
	h := "shardBucket"

	var alreadyRan bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1`, h).Scan(&alreadyRan)
	if alreadyRan {
		fmt.Printf("hash %s exists skipping ddl \n", h)
		return
	}

	fmt.Println("starting sharding of CDK bucket")
	start := time.Now()
	ctx := context.Background()

	// collect all keys
	keys := []string{}
	iter := bucket.List(nil)
	for {
		obj, err := iter.Next(ctx)
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatalf("error listing bucket: %v", err)
		}
		// ignore "my_cuckoo" key and keys that already migrated (in case of restart halfway through)
		// also ignore .tmp files that fileblob creates
		if strings.HasPrefix(obj.Key, "ba") && !strings.Contains(obj.Key, "/") && !strings.HasSuffix(obj.Key, ".tmp") {
			keys = append(keys, obj.Key)
		}
	}

	var wg sync.WaitGroup
	sem := make(chan struct{}, 10) // semaphore to limit 10 uploads at a time

	// migrate keys to sharded locations
	for _, key := range keys {
		wg.Add(1)

		go func(k string) {
			defer wg.Done()

			sem <- struct{}{}
			defer func() { <-sem }()

			newKey := cidutil.ShardCID(k)

			err := bucket.Copy(ctx, newKey, k, nil)
			if err != nil {
				log.Fatalf("error copying unsharded key to sharded key: %v (migrating %s to %s)", err, k, newKey)
			}

			err = bucket.Delete(ctx, k)
			if err != nil {
				log.Fatalf("error deleting old blob: %v (migrating %s to %s)", err, k, newKey)
			}
		}(key)
	}

	wg.Wait()

	mustExec(db, `insert into mediorum_migrations values ($1, now()) on conflict do nothing`, h)
	fmt.Printf("finished sharding CDK bucket. took %gm\n", time.Since(start).Minutes())
}

func logAndWriteToFile(message string, fileName string) {
	dir := "/tmp/mediorum"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.Mkdir(dir, 0755)
	}
	filePath := fmt.Sprintf("/tmp/mediorum/%s", fileName)

	f, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("Failed to open log file %s: %v", filePath, err)
	}
	defer f.Close()

	slog.Info(message)

	if _, err := f.WriteString(message + "\n"); err != nil {
		log.Fatalf("Failed to write to log file %s: %v", filePath, err)
	}

	f.Sync()
}
