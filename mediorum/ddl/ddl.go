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

func Migrate(db *sql.DB, bucket *blob.Bucket) {
	mustExec(db, mediorumMigrationTable)

	migratePartitionOps(db) // TODO: Remove after every node runs this
	runMigration(db, delistStatusesDDL)
	runMigration(db, cleanUpUnfindableCIDsDDL) // TODO: Remove after every node runs this
	// TODO: remove after this ran once on every node (when every node is >= v0.4.2)
	migrateShardBucket(db, bucket)

	schedulepartitionOpsMigration(db) // TODO: Remove after every node runs the partition ops migration
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

func schedulepartitionOpsMigration(db *sql.DB) {
	// stagger between 1-8hrs
	min := 60
	max := 60 * 8
	randomTime := time.Minute * time.Duration(rand.Intn(max-min+1)+min)
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

func migratePartitionOps(db *sql.DB) {
	slog.Info("checking if it's time to partition ops...")
	var scheduled bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1`, partition_ops_scheduled).Scan(&scheduled)
	if !scheduled {
		fmt.Println("partition ops migration not scheduled, skipping ddl")
		return
	}

	logfileName := "partition_ops.txt"

	logAndWriteToFile(fmt.Sprint("starting partitioning of ops"), logfileName)
	start := time.Now()

	mustExec(
		db,
		`begin;
		-- Kill all long-running sql queries
		SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '1 minute';

    -- Rename ops to old_ops if this has not already been done
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
			"data" JSONB,
			"transient" BOOLEAN
		) PARTITION BY HASH ("host");

		DO $$ 
		DECLARE 
			i INTEGER;
			partition_name TEXT;
		BEGIN 
			FOR i IN 0..1008 LOOP -- 1009 partitions
				partition_name := 'ops_' || i;
				EXECUTE 'CREATE TABLE IF NOT EXISTS' || partition_name || ' PARTITION OF ops FOR VALUES WITH (MODULUS 1009, REMAINDER ' || i || ');';
				EXECUTE 'ALTER TABLE ' || partition_name || ' ADD PRIMARY KEY ("ulid");';
			END LOOP; 
		END $$;

		commit;`,
	)

	err := migrateOpsData(db, logfileName)
	if err != nil {
		logAndWriteToFile(err.Error(), logfileName)
		log.Fatal(err)
	}

	mustExec(db, `DROP TABLE old_ops`)

	mustExec(db, `insert into mediorum_migrations values ($1, now()) on conflict do nothing`, partition_ops_completed)
	logAndWriteToFile(fmt.Sprintf("finished partitioning ops. took %gm\n", time.Since(start).Minutes()), logfileName)
}

// copy data from old_ops to ops
func migrateOpsData(db *sql.DB, logfileName string) error {
	logAndWriteToFile(fmt.Sprintln("starting ops data migration"), logfileName)
	lastUlid := ""
	pageSize := 1000
	rowsMigrated := 0

	for {
		rows, err := db.Query(`SELECT "ulid", "host", "action", "table", "data", "transient" FROM old_ops WHERE ulid > $1 ORDER BY "ulid" ASC LIMIT $2`, lastUlid, pageSize)
		if err != nil {
			return err
		}
		var ops []crudr.Op
		if err := rows.Scan(&ops); err != nil {
			return err
		}
		rows.Close()

		if len(ops) == 0 {
			// we've migrated all rows
			logAndWriteToFile(fmt.Sprintf("successfully migrated %d ops rows\n", rowsMigrated), logfileName)
			return nil
		}

		mustExec(db, `INSERT INTO ops ("ulid", "host", "action", "table", "data") SELECT * FROM unnest($1::ops_type[]) ON CONFLICT DO NOTHING`, ops)
		rowsMigrated += len(ops)
		lastUlid = ops[len(ops)-1].ULID

		// delete all rows that we migrated
		mustExec(db, `DELETE FROM old_ops WHERE ulid <= $1`, lastUlid)

		// keep paginating
		time.Sleep(time.Second * 10)
	}
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

	fmt.Println(message)

	if _, err := f.WriteString(message + "\n"); err != nil {
		log.Fatalf("Failed to write to log file %s: %v", filePath, err)
	}

	f.Sync()
}
