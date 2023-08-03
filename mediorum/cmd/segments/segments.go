package segments

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	_ "github.com/lib/pq"
)

const (
	batchSize = 1000
)

type mediorumClient struct {
	db           *sql.DB
	isTest       bool
	delete       bool
	dbNumFound   int64
	diskNumFound int64
	mu           sync.Mutex
}

type MediorumClientConfig struct {
	isTest bool
	Delete bool
}

func init() {
	// Catch control+c so you can check things are working on a large fs without waiting
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-interrupt
		fmt.Printf("\ntrapped SIGINT...\n\n")
		os.Exit(0)
	}()
}

func waitForPostgresConnection(db *sql.DB) {
	var err error
	maxRetries := 10
	for i := 0; i < maxRetries; i++ {
		err = db.Ping()
		if err == nil {
			log.Println("Connected to DB.")
			return
		}

		log.Printf("Could not connect to DB: %v", err)

		waitTime := time.Duration(i*i) * time.Second
		log.Printf("Sleeping for %v seconds", waitTime.Seconds())
		time.Sleep(waitTime)
	}

	log.Fatalf("Could not connect to DB after %d attempts, last error: %v", maxRetries, err)
}

func newMediorumClient(c *MediorumClientConfig) (*mediorumClient, error) {

	dbUrl := os.Getenv("dbUrl")
	if dbUrl == "" {
		dbUrl = "postgres://postgres:example@localhost:5454/m1"
	}

	db, err := sql.Open("postgres", fmt.Sprintf("%s?sslmode=disable", dbUrl))
	if err != nil {
		return nil, err
	}

	waitForPostgresConnection(db)

	return &mediorumClient{
		db:           db,
		isTest:       c.isTest,
		delete:       c.Delete,
		dbNumFound:   0,
		diskNumFound: 0,
	}, nil
}

func (m *mediorumClient) close() error {
	var err error

	err = m.db.Close()
	if err != nil {
		return err
	}

	return nil
}

func (m *mediorumClient) scanForSegments(storagePathChan chan<- string) error {
	tableName := "Files"
	if m.isTest {
		tableName = "FilesTest"
	}

	sql := fmt.Sprintf(`SELECT "storagePath" FROM "%s" WHERE "type" = 'track';`, tableName)
	fmt.Printf("\nPerforming sql: %s\n", sql)

	rows, err := m.db.Query(sql)
	if err != nil {
		return err
	}
	defer rows.Close()

	batch := make([]string, 0, batchSize)
	for rows.Next() {
		m.dbNumFound++
		var fileLocation string
		if err := rows.Scan(&fileLocation); err != nil {
			return err
		}

		batch = append(batch, fileLocation)
		if len(batch) >= batchSize {
			m.processBatch(batch, storagePathChan)
			batch = batch[:0]
		}
	}

	if err := rows.Err(); err != nil {
		return err
	}

	// Process remaining batch if any
	if len(batch) > 0 {
		m.processBatch(batch, storagePathChan)
	}

	return nil
}

func (m *mediorumClient) processBatch(batch []string, storagePathChan chan<- string) {
	fmt.Printf(".")
	for _, fileLocation := range batch {
		if _, err := os.Stat(fileLocation); err == nil {
			storagePathChan <- fileLocation
		}
	}
}

func (m *mediorumClient) processSegments(storagePathChan <-chan string) error {
	var batch []string
	for fileLocation := range storagePathChan {
		batch = append(batch, fileLocation)
		if len(batch) >= batchSize {
			if err := m.deleteBatch(batch); err != nil {
				return err
			}
			batch = batch[:0]
		}
	}
	// process remaining batch if any
	if len(batch) > 0 {
		if err := m.deleteBatch(batch); err != nil {
			return err
		}
	}

	return nil
}

func (m *mediorumClient) deleteBatch(batch []string) error {
	for _, path := range batch {
		if _, err := os.Stat(path); err == nil {
			if m.delete {
				if err := os.Remove(path); err != nil {
					if os.IsNotExist(err) {
						continue
					} else {
						return err
					}
				}
			}
			m.mu.Lock()
			m.diskNumFound++
			m.mu.Unlock()
		}
	}

	return nil
}

func Run(c *MediorumClientConfig) {
	var (
		err error
		m   *mediorumClient
		wg  sync.WaitGroup
	)

	m, err = newMediorumClient(c)
	defer m.close()

	if !m.delete {
		fmt.Println("Performing dry run. Use `--delete` to remove segment files and rows.")
	}

	storagePathChan := make(chan string, batchSize)

	wg.Add(1)
	go func() {
		err = m.scanForSegments(storagePathChan)
		defer close(storagePathChan) // signal when no more work to be done
		if err != nil {
			log.Fatalf("Failed to call segments.Run(): %v", err)
		}
		wg.Done()
	}()

	numWorkers := 5
	wg.Add(numWorkers)
	for i := 0; i < numWorkers; i++ {
		go func() {
			err = m.processSegments(storagePathChan)
			if err != nil {
				log.Fatalf("Failed to delete segments and rows: %v", err)
			}
			wg.Done()
		}()
	}

	wg.Wait()

	fmt.Printf("\nFound  : %d rows  of type 'track' in the db.\n", m.dbNumFound)
	fmt.Printf("Found  : %d files of type 'track' on disk.\n", m.diskNumFound)

	// cleanup db in a single op. non spammy
	if m.delete {
		tableName := "Files"
		if m.isTest {
			tableName = "FilesTest"
		}

		sql := fmt.Sprintf(`DELETE FROM "%s" WHERE "type" = 'track'`, tableName)
		fmt.Printf("\nPerforming sql: %s\n", sql)

		res, err := m.db.Exec(sql)
		if err != nil {
			log.Fatal(err)
		}

		rowCount, err := res.RowsAffected()
		if err != nil {
			log.Fatal(err)
		}

		fmt.Printf("Deleted: %d rows  of type 'track' from '%s' table.\n", rowCount, tableName)
		fmt.Printf("Deleted: %d files of type 'track' on disk.\n", m.diskNumFound)
	}

	fmt.Println("\nDONE.")
}
