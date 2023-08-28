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
	"strings"
	"sync"
	"time"

	_ "embed"

	"gocloud.dev/blob"
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

func Migrate(db *sql.DB, bucket *blob.Bucket) {
	mustExec(db, mediorumMigrationTable)

	migratePartitionOps(db) // TODO: Remove after every node runs this
	runMigration(db, delistStatusesDDL)
	runMigration(db, cleanUpUnfindableCIDsDDL) // TODO: Remove after every node runs this
	// TODO: remove after this ran once on every node (when every node is >= v0.4.2)
	migrateShardBucket(db, bucket)
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

func migratePartitionOps(db *sql.DB) {
	h := "partitionOps"
	var alreadyRan bool
	db.QueryRow(`select count(*) = 1 from mediorum_migrations where hash = $1`, h).Scan(&alreadyRan)
	if alreadyRan {
		fmt.Printf("hash %s exists, skipping ddl\n", h)
		return
	}

	fmt.Println("starting partitioning of ops")
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
			FOR i IN 0..100 LOOP -- 101 partitions
				partition_name := 'ops_' || i;
				EXECUTE 'CREATE TABLE IF NOT EXISTS' || partition_name || ' PARTITION OF ops FOR VALUES WITH (MODULUS 101, REMAINDER ' || i || ');';
				EXECUTE 'ALTER TABLE ' || partition_name || ' ADD PRIMARY KEY ("ulid");';
			END LOOP; 
		END $$;

		commit;`,
	)

	err := migrateOpsData(db)
	if err != nil {
		log.Fatal(err)
	}

	mustExec(db, `DROP TABLE old_ops`)

	mustExec(db, `insert into mediorum_migrations values ($1, now()) on conflict do nothing`, h)
	fmt.Printf("finished partitioning ops. took %gm\n", time.Since(start).Minutes())
}

// copy data from old_ops to ops
func migrateOpsData(db *sql.DB) error {
	fmt.Println("starting ops data migration")
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
			fmt.Printf("successfully migrated %d ops rows\n", rowsMigrated)
			return nil
		}

		mustExec(db, `INSERT INTO ops ("ulid", "host", "action", "table", "data") SELECT * FROM unnest($1::ops_type[])`, ops)
		rowsMigrated += len(ops)

		// delete all rows that we migrated
		var ulidsToDelete []string
		for _, op := range ops {
			ulidsToDelete = append(ulidsToDelete, op.ULID)
		}
		mustExec(db, `DELETE FROM old_ops WHERE ulid = ANY($1)`, ulidsToDelete)

		// keep paginating
		lastUlid = ops[len(ops)-1].ULID

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
