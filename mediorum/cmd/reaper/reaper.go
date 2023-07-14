package reaper

import (
	"bufio"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
	"strings"
	"syscall"
	"time"
	"unsafe"

	_ "github.com/lib/pq"
)

var (
	FILE_TYPES = []string{"track", "copy320", "metadata", "image", "dir", "not_in_db"}
	config     *Config
	dbUrl      string
	reaperCmd  *flag.FlagSet
	b          *Batcher
	BATCH_SIZE int
)

type FileRow struct {
	StoragePath string
	Type        string
}

type Config struct {
	MoveFiles bool
	MoveDir   string
	WalkDir   string
	LogDir    string
	dbUrl     string
	isTest    bool
}

type Batcher struct {
	DB        *sql.DB
	Outfile   *os.File
	OutWriter *bufio.Writer
	Iteration int
	Batch     []string
	Config    *Config
	counter   map[string]map[string]int
}

func NewBatcher(config *Config) (*Batcher, error) {

	var (
		db      *sql.DB
		err     error
		outfile *os.File
	)

	db, err = sql.Open("postgres", fmt.Sprintf("%s?sslmode=disable", config.dbUrl))
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	reaperDirs := []string{
		filepath.Join(config.MoveDir, "not_in_db"),
		filepath.Join(config.MoveDir, "segments"),
		config.WalkDir,
		config.LogDir,
	}

	for _, dir := range reaperDirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			err := os.MkdirAll(dir, 0755)
			if err != nil {
				fmt.Println("Failed to create directory:", err)
				return nil, err
			}
		}
	}

	outfile, err = os.Create(filepath.Join(config.LogDir, "files_on_disk_not_in_db.txt"))
	if err != nil {
		return nil, err
	}
	outWriter := bufio.NewWriter(outfile)

	return &Batcher{
		DB:        db,
		Outfile:   outfile,
		OutWriter: outWriter,
		Iteration: 0,
		Batch:     make([]string, 0, BATCH_SIZE),
		Config:    config,
		counter:   initCounter(),
	}, nil
}

func (b *Batcher) Close() error {
	var err error

	err = b.DB.Close()
	if err != nil {
		return err
	}

	err = b.Outfile.Close()
	if err != nil {
		return err
	}

	err = b.OutWriter.Flush()
	if err != nil {
		return err
	}

	return nil
}

func initCounter() map[string]map[string]int {
	counter := make(map[string]map[string]int)

	for _, fileType := range FILE_TYPES {
		counter[fileType] = make(map[string]int)
		counter[fileType]["count"] = 0
		counter[fileType]["error_count"] = 0
		counter[fileType]["bytes_used"] = 0
	}

	return counter
}

func init() {
	fmt.Println("reaper.go init() called")

	BATCH_SIZE = 1000

	dbUrl = os.Getenv("dbUrl")
	if dbUrl == "" {
		dbUrl = "postgres://postgres:example@localhost:5454/m1"
	}
}

func _init() {
	reaperCmd = flag.NewFlagSet("reaper", flag.ExitOnError)
	moveFiles := reaperCmd.Bool("move", false, "move files (default false)")
	logDir := reaperCmd.String("logDir", "/tmp/reaper/logs", "directory to store job logs (default: /tmp/reaper/logs)")
	moveDir := reaperCmd.String("moveDir", "/tmp/reaper/to_delete", "directory to move files staged for deletion (default: /tmp/reaper/to_delete)")
	walkDir := reaperCmd.String("walkDir", "/tmp/reaper/to_walk", "directory to walk (default: /tmp/reaper/to_walk)")
	reaperCmd.Parse(os.Args[2:])

	config = &Config{
		MoveFiles: *moveFiles,
		MoveDir:   *moveDir,
		WalkDir:   *walkDir,
		LogDir:    *logDir,
		dbUrl:     dbUrl,
	}

	fmt.Printf("config: %+v\n", config)
}

func main() {
	fmt.Println("reaper.go main() called")
}

func _trap() {
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-interrupt
		fmt.Printf("\ntrapped SIGINT...\n\n")
		report(b)
		os.Exit(0)
	}()
}

func Run() {

	_init() // flag parsing in init() causes `go test` to fail

	_trap()

	var err error

	b, err = NewBatcher(config)
	if err != nil {
		log.Fatal(err)
	}
	defer b.Close()

	err = b.Walk()
	if err != nil {
		log.Fatal(err)
	}

	report(b)
}

func WalkTwo() {
	filePaths := make(chan string)

	// Start a goroutine to walk the directory and send file paths to the channel
	go func() {
		defer close(filePaths)
		err := filepath.Walk(config.WalkDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if !info.IsDir() {
				filePaths <- path
			}
			return nil
		})
		if err != nil {
			fmt.Println("Error walking directory:", err)
		}
	}()

	// Create a batch slice to hold file paths for batch processing
	batch := make([]string, 0, BATCH_SIZE)

	b, err := NewBatcher(config)
	if err != nil {
		log.Fatal(err)
	}
	defer b.Close()

	// Process file paths in batches
	for filePath := range filePaths {
		batch = append(batch, filePath)

		// If the batch size is reached, process the batch
		if len(batch) == BATCH_SIZE {
			err = processBatch(b.DB, batch)
			if err != nil {
				fmt.Println("Error processing batch:", err)
			}
			batch = batch[:0] // Reset the batch slice
		}
	}

	// Process any remaining files in the last batch
	if len(batch) > 0 {
		err = processBatch(b.DB, batch)
		if err != nil {
			fmt.Println("Error processing final batch:", err)
		}
	}
}

func processBatch(db *sql.DB, batch []string) error {
	// Perform batch processing with the file paths in the batch slice
	// Here, you can execute your desired operations, such as querying from a PostgreSQL table

	// Example: Selecting distinct rows matching the file paths in a "files" table
	query := `SELECT DISTINCT "storagePath", "type", size FROM "FilesTest" WHERE "storagePath" = ANY($1)`
	rows, err := db.Query(query, batch)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var rowStoragePath string
		var rowType string
		err := rows.Scan(&rowStoragePath, &rowType)
		if err != nil {
			return err
		}

		fmt.Printf("Path: %s, Type: %s\n", rowStoragePath, rowType)
	}

	err = rows.Err()
	if err != nil {
		return err
	}

	return nil
}

func (b *Batcher) Walk() error {

	err := filepath.Walk(b.Config.WalkDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.Mode().IsRegular() {
			b.Batch = append(b.Batch, path)

			if len(b.Batch) == BATCH_SIZE {
				b.handleBatch()
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	if len(b.Batch) > 0 {
		b.handleBatch()
	}

	return nil
}

func (b *Batcher) handleBatch() {
	// fmt.Println(b.Batch)
	sort.Strings(b.Batch)
	// sort.Sort(sort.Reverse(sort.StringSlice(b.Batch)))
	// fmt.Println(b.Batch)
	b.Iteration++
	fmt.Printf("iteration:        %d\n", b.Iteration)

	rowsInDB, rowsNotInDB := b.checkDB()
	fmt.Printf("files_in_db:      %d\n", len(rowsInDB))
	fmt.Printf("files_not_in_db:  %d\n\n", len(rowsNotInDB))
	fmt.Printf("sizeof b.Batch: %d bytes\n", unsafe.Sizeof(b.Batch))

	for _, filePath := range rowsNotInDB {
		// if ! contains()
		b.handleFileNotInDB(filePath)
	}
	rowsNotInDB = nil

	for _, row := range rowsInDB {
		b.handleFileInDB(row)
	}
	rowsInDB = nil

	// b.Batch = b.Batch[:0]
	// Clear the Batch slice
	b.Batch = make([]string, 0, BATCH_SIZE)
}

func (b *Batcher) checkDB() ([]FileRow, []string) {
	pathsSQL := strings.Join(quoteStrings(b.Batch), ",")
	tableName := "Files"
	if config.isTest {
		tableName = "FilesTest"
	}
	// TODO orderby
	query := fmt.Sprintf(`
		SELECT DISTINCT "storagePath", "type"
		FROM "%s" 
		WHERE "storagePath" IN (%s) 
		ORDER BY "storagePath" ASC`, tableName, pathsSQL)
	rows, err := b.DB.Query(query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	rowsInDB := make([]FileRow, 0)
	for rows.Next() {
		var row FileRow
		err := rows.Scan(&row.StoragePath, &row.Type)
		if err != nil {
			log.Fatal(err)
		}
		rowsInDB = append(rowsInDB, row)
	}

	rowsInDBMap := make(map[string]bool)
	for _, row := range rowsInDB {
		rowsInDBMap[row.StoragePath] = true
	}

	rowsNotInDB := make([]string, 0)
	for _, storagePath := range b.Batch {
		if _, found := rowsInDBMap[storagePath]; !found {
			rowsNotInDB = append(rowsNotInDB, storagePath)
		}
	}

	time.Sleep(time.Millisecond * 200)

	return rowsInDB, rowsNotInDB
}

func (b *Batcher) handleFileNotInDB(filePath string) {
	defer func() {
		if r := recover(); r != nil {
			b.counter["not_in_db"]["error_count"]++
		}
	}()

	fileInfo, err := os.Stat(filePath)
	if err != nil {
		b.counter["not_in_db"]["error_count"]++
		return
	}

	b.counter["not_in_db"]["count"]++
	b.counter["not_in_db"]["bytes_used"] += int(fileInfo.Size())

	b.Outfile.WriteString(filePath + "\n")

	if b.Config.MoveFiles {
		// Move file to a staging delete directory
		// Retain all subdirs in case we want to move back before deleting
		moveFile(filePath, filepath.Join(filepath.Join(b.Config.MoveDir, "not_in_db"), filePath))

		// Remove empty directories
		parentDir := filepath.Dir(filePath)
		for parentDir != b.Config.WalkDir {
			isEmpty, err := isDirectoryEmpty(parentDir)
			if err != nil {
				log.Println("Failed to check if directory is empty:", err)
				break
			}

			if isEmpty {
				err := os.Remove(parentDir)
				if err != nil {
					log.Println("Failed to remove empty directory:", err)
				}
			} else {
				break
			}

			parentDir = filepath.Dir(parentDir)
		}
	}
}

func (b *Batcher) handleFileInDB(row FileRow) {
	defer func() {
		if r := recover(); r != nil {
			b.counter[row.Type]["error_count"]++
		}
	}()

	if contains(FILE_TYPES, row.Type) {
		fileInfo, err := os.Stat(row.StoragePath)
		if err != nil {
			b.counter[row.Type]["error_count"]++
			return
		}

		b.counter[row.Type]["count"]++
		b.counter[row.Type]["bytes_used"] += int(fileInfo.Size())

		// Segments
		if row.Type == "track" {
			if b.Config.MoveFiles {
				// Move file to a staging delete directory
				// Retain all subdirs in case we want to move back before deleting
				moveFile(row.StoragePath, filepath.Join(filepath.Join(b.Config.MoveDir, "segments"), row.StoragePath))
			}
		}
	}
}
