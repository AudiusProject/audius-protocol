package segments

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	_ "github.com/lib/pq"
)

const (
	batchSize         = 1000
	numWorkers        = 5
	sleepMilliseconds = 10
	deleteDBRows      = false
)

var interrupted bool

type mediorumClient struct {
	db             *sql.DB
	isTest         bool
	delete         bool
	dbNumFound     int64
	dbNumDeleted   int64
	diskNumFound   int64
	diskNumDeleted int64
	mu             sync.Mutex
}

type MediorumClientConfig struct {
	isTest bool
	Delete bool
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

	lastFileUUID := "00000000-0000-0000-0000-000000000000"
	for {
		sql := fmt.Sprintf(`SELECT "storagePath", "type", "fileUUID" FROM "%s" WHERE "fileUUID" > $1 ORDER BY "fileUUID" LIMIT %d;`, tableName, batchSize)

		rows, err := m.db.Query(sql, lastFileUUID)
		if err != nil {
			return err
		}

		batch := make([]string, 0, batchSize)
		recordsFetched := 0
		var currentStoragePath, fileType, currentFileUUID string
		for rows.Next() {
			recordsFetched++
			if err := rows.Scan(&currentStoragePath, &fileType, &currentFileUUID); err != nil {
				rows.Close()
				return err
			}

			if fileType == "track" {
				m.dbNumFound++
				batch = append(batch, currentStoragePath)
			}
		}
		rows.Close()

		if len(batch) > 0 {
			m.processBatch(batch, storagePathChan)
		}

		if recordsFetched < batchSize {
			break
		}

		lastFileUUID = currentFileUUID
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

	if len(batch) > 0 {
		if err := m.deleteBatch(batch); err != nil {
			return err
		}
	}

	return nil
}

func (m *mediorumClient) deleteBatch(batch []string) error {
	numDiskDeleted := 0
	pathsToDelete := make([]string, 0, len(batch))

	for _, path := range batch {
		if _, err := os.Stat(path); err == nil {
			if m.delete {
				if err := os.Remove(path); err != nil {
					if !os.IsNotExist(err) {
						return err
					}
				}
				m.mu.Lock()
				m.diskNumDeleted++
				m.mu.Unlock()
				numDiskDeleted++
				escapedPath := fmt.Sprintf("'%s'", path) // Enclose in single quotes for SQL
				pathsToDelete = append(pathsToDelete, escapedPath)
			}
			m.mu.Lock()
			m.diskNumFound++
			m.mu.Unlock()
		}
		time.Sleep(time.Millisecond * sleepMilliseconds) // Be kind to i/o
	}

	if len(pathsToDelete) > 0 && deleteDBRows {
		tableName := "Files"
		if m.isTest {
			tableName = "FilesTest"
		}

		sql := fmt.Sprintf(`DELETE FROM "%s" WHERE "storagePath" IN (%s)`, tableName, strings.Join(pathsToDelete, ","))
		res, err := m.db.Exec(sql)
		if err != nil {
			return err
		}

		rowCount, err := res.RowsAffected()
		if err != nil {
			log.Fatal(err)
		}

		m.mu.Lock()
		m.dbNumDeleted += rowCount
		m.mu.Unlock()

		fmt.Printf("\nDeleted: %d rows  of type 'track' from '%s' table.\n", rowCount, tableName)
		fmt.Printf("Deleted: %d files of type 'track' on disk.\n", numDiskDeleted)
	}

	return nil
}

func writeToFile(message string) {
	dir := "/tmp/mediorum"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.Mkdir(dir, 0755)
	}
	file := "/tmp/mediorum/segments.txt"

	f, err := os.OpenFile(file, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}
	defer f.Close()

	if _, err := f.WriteString(message + "\n"); err != nil {
		log.Fatalf("Failed to write to log file: %v", err)
	}

	f.Sync()
}

func cleanup(m *mediorumClient) {

	fmt.Println("\nperforming cleanup()")

	m.close()

	fmt.Printf("\n----------------------------------------------\n")

	fmt.Printf("Found  : %d rows  of type 'track' in the db.\n", m.dbNumFound)
	fmt.Printf("Found  : %d files of type 'track' on disk.", m.diskNumFound)

	if m.delete {
		fmt.Printf("\nDeleted: %d rows  of type 'track' from the db.\n", m.dbNumDeleted)
		fmt.Printf("Deleted: %d files of type 'track' on disk.", m.diskNumDeleted)
	}

	fmt.Printf("\n----------------------------------------------\n")

	if !interrupted {
		completionTime := time.Now()
		writeToFile(fmt.Sprintf("Completion Time: %s", completionTime))
		fmt.Println("\nDONE.")
	}
}

func Run(c *MediorumClientConfig) {
	var (
		err error
		m   *mediorumClient
	)

	startTime := time.Now()
	writeToFile(fmt.Sprintf("Start Time: %s", startTime))

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	m, err = newMediorumClient(c)
	if err != nil {
		log.Println("Error creating new mediorum client:", err)
		return
	}

	defer cleanup(m)

	go func() {
		<-interrupt
		fmt.Printf("\ntrapped SIGINT...\n\n")
		interrupted = true
		cleanup(m)
	}()

	if !m.delete {
		fmt.Println("Performing dry run. Use `--delete` to remove segment files and rows.")
	}

	storagePathChan := make(chan string, batchSize)

	go func() {
		defer close(storagePathChan) // signal when no more work to be done
		err = m.scanForSegments(storagePathChan)
		if err != nil {
			log.Println("Failed to call segments.Run():", err)
		}
	}()

	err = m.processSegments(storagePathChan)
	if err != nil {
		log.Println("Failed to delete segments and rows:", err)
	}
}
