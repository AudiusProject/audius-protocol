package ddl

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"math/rand"
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

//go:embed drop_blobs.sql
var dropBlobs string

var mediorumMigrationTable = `
	create table if not exists mediorum_migrations (
		"hash" text primary key,
		"ts" timestamp
	);
`

// TODO: Remove after every node runs the ops partition migration
var partitionOpsScheduled = "partitionOpsScheduled"
var partitionOpsCompleted = "partitionedOps"
var partitionOpsLogFile = "partition_ops.txt"

func Migrate(db *sql.DB, gormDB *gorm.DB, bucket *blob.Bucket, myHost string) {
	mustExec(db, mediorumMigrationTable)

	migratePartitionOps(db, gormDB) // TODO: Remove after every node runs this

	runMigration(db, delistStatusesDDL)

	// TODO: remove after this ran once on every node (when every node is >= v0.4.2)
	migrateShardBucket(db, bucket)

	runMigration(db, dropBlobs)

	schedulePartitionOpsMigration(db, myHost) // TODO: Remove after every node runs the partition ops migration
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

func schedulePartitionOpsMigration(db *sql.DB, myHost string) {
	// stagger between 0.5-12hrs
	min := 30
	max := 60 * 12
	randomTime := time.Minute * time.Duration(rand.Intn(max+1-min)+min)
	// manually schedule foundation nodes so can disable monitoring
	// appropriately
	if myHost == "https://creatornode.audius.co" {
		randomTime = time.Minute * time.Duration(20)
	}
	if myHost == "https://creatornode3.audius.co" || myHost == "https://usermetadata.audius.co" {
		randomTime = time.Minute * time.Duration(110)
	}
	if myHost == "https://creatornode2.audius.co" {
		randomTime = time.Minute * time.Duration(240)
	}
	slog.Info("checking if we need to schedule the partition ops migration...")
	var partitioned bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1`, partitionOpsCompleted).Scan(&partitioned)
	if partitioned {
		slog.Info("already partitioned ops, skipping migration scheduling")
	} else {
		slog.Info("scheduling partition ops migration", "time", randomTime.String())
		time.AfterFunc(randomTime, func() {
			slog.Info("marking migrations table to partition ops after we restart...")
			mustExec(db, `insert into mediorum_migrations values ($1, now()) on conflict do nothing`, partitionOpsScheduled)
			os.Exit(0)
		})
	}
}

func migratePartitionOpsError(err error) {
	logAndWriteToFile(err.Error(), partitionOpsLogFile)
	log.Fatal(err)
}

func migratePartitionOps(db *sql.DB, gormDB *gorm.DB) {
	slog.Info("checking if it's time to partition ops...")
	var scheduled bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1;`, partitionOpsScheduled).Scan(&scheduled)
	if !scheduled {
		slog.Info("partition ops migration not scheduled, skipping ddl")
		return
	}

	logAndWriteToFile("starting partitioning of ops", partitionOpsLogFile)
	start := time.Now()

	_, err := db.Exec(
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
	if err != nil {
		migratePartitionOpsError(err)
	}

	err = migrateOpsData(db, gormDB)
	if err != nil {
		migratePartitionOpsError(err)
	}

	ctx := context.Background()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		migratePartitionOpsError(err)
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(
		ctx,
		`DROP TABLE old_ops;`,
	)
	_, err = tx.ExecContext(
		ctx,
		`INSERT INTO mediorum_migrations VALUES ($1, now()) ON CONFLICT DO NOTHING;`,
		partitionOpsCompleted,
	)
	if err != nil {
		migratePartitionOpsError(err)
	}
	_, err = tx.ExecContext(
		ctx,
		`DELETE FROM mediorum_migrations WHERE hash = $1;`,
		partitionOpsScheduled,
	)
	if err != nil {
		migratePartitionOpsError(err)
	}
	if err = tx.Commit(); err != nil {
		migratePartitionOpsError(err)
	}

	logAndWriteToFile(fmt.Sprintf("finished partitioning ops. took %gm", time.Since(start).Minutes()), partitionOpsLogFile)
}

// copy data from old_ops to ops
func migrateOpsData(db *sql.DB, gormDB *gorm.DB) error {
	logAndWriteToFile("starting ops data migration", partitionOpsLogFile)
	lastULID := ""
	pageSize := 3000
	rowsMigrated := 0

	for {
		var ops []crudr.Op

		// select a batch of rows starting from the lastULID
		err := gormDB.Table("old_ops").Where("ulid > ?", lastULID).Order("ulid asc").Limit(pageSize).Find(&ops).Error
		if err != nil {
			return err
		}

		if len(ops) == 0 {
			// we've migrated all rows
			logAndWriteToFile(fmt.Sprintf("successfully migrated %d ops rows\n", rowsMigrated), partitionOpsLogFile)
			return nil
		}

		_, err = db.Exec(`INSERT INTO ops ("ulid", "host", "action", "table", "data") VALUES ` + constructOpsBulkInsertValuesString(ops) + ` ON CONFLICT DO NOTHING`)
		if err != nil {
			return err
		}
		rowsMigrated += len(ops)
		lastULID = ops[len(ops)-1].ULID

		// delete all rows that we migrated
		_, err = db.Exec(`DELETE FROM old_ops WHERE ulid <= $1;`, lastULID)
		if err != nil {
			return err
		}

		// keep paginating
		time.Sleep(time.Millisecond * 100)
	}
}

func constructOpsBulkInsertValuesString(ops []crudr.Op) string {
	values := ""
	for i, op := range ops {
		formattedData := strings.ReplaceAll(string(op.Data), "'", "''")
		values += "('" + op.ULID + "', '" + op.Host + "', '" + op.Action + "', '" + op.Table + "', '" + formattedData + "')"
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
		slog.Error(fmt.Sprintf("Error opening %s", fileName), "err", err)
		return
	}
	defer f.Close()

	slog.Info(message)

	if _, err := f.WriteString(message + "\n"); err != nil {
		slog.Error(fmt.Sprintf("Error writing to %s", fileName), "err", err)
		return
	}

	f.Sync()
}
