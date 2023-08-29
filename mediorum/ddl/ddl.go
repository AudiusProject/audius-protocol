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
