package reaper

import (
	"database/sql"
	"flag"
	"fmt"
	"log"

	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/lib/pq"
)

var (
	FILE_TYPES = []string{"track", "copy320", "metadata", "image", "dir", "not_in_db"}
	config     *Config
	dbUrl      string
	reaperCmd  *flag.FlagSet
	r          *Reaper
	BATCH_SIZE int
)

type FileRow struct {
	StoragePath string
	Type        string
}

type Config struct {
	DeleteFiles bool
	WalkDir     string
	LogDir      string
	dbUrl       string
	isTest      bool
}

type Reaper struct {
	DB        *sql.DB
	Outfile   *os.File
	Iteration int
	Batch     []string
	Config    *Config
	counter   map[string]map[string]int
}

func NewReaper(config *Config) (*Reaper, error) {

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

	outfile, err = os.Create(filepath.Join(config.LogDir, "files_on_disk_not_in_dr.txt"))
	if err != nil {
		return nil, err
	}

	return &Reaper{
		DB:        db,
		Outfile:   outfile,
		Iteration: 0,
		Batch:     make([]string, 0, BATCH_SIZE),
		Config:    config,
		counter:   initCounter(),
	}, nil
}

func (r *Reaper) Close() error {
	var err error

	err = r.DB.Close()
	if err != nil {
		return err
	}

	err = r.Outfile.Close()
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
	BATCH_SIZE = 1000

	dbUrl = os.Getenv("dbUrl")
	if dbUrl == "" {
		dbUrl = "postgres://postgres:example@localhost:5454/m1"
	}
}

func _init() {
	reaperCmd = flag.NewFlagSet("reaper", flag.ExitOnError)
	deleteFiles := reaperCmd.Bool("delete", false, "delete files (default false)")
	logDir := reaperCmd.String("logDir", "/tmp/reaper/logs", "directory to store job logs (default: /tmp/reaper/logs)")
	walkDir := reaperCmd.String("walkDir", "/tmp/reaper/to_walk", "directory to walk (default: /tmp/reaper/to_walk)")
	reaperCmd.Parse(os.Args[2:])

	config = &Config{
		DeleteFiles: *deleteFiles,
		WalkDir:     *walkDir,
		LogDir:      *logDir,
		dbUrl:       dbUrl,
	}

	fmt.Printf("config: %+v\n", config)
}

func _trap() {
	// Catch control+c so you can check things are working on a large fs without waiting
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-interrupt
		fmt.Printf("\ntrapped SIGINT...\n\n")
		r.report()
		os.Exit(0)
	}()
}

func Run() {

	_init() // Flag parsing in init() causes `go test` to fail

	_trap()

	var err error

	r, err = NewReaper(config)
	if err != nil {
		log.Fatal(err)
	}
	defer r.Close()

	err = r.Walk()
	if err != nil {
		log.Fatal(err)
	}

	r.report()
}

func (r *Reaper) Walk() error {

	r.counter = initCounter()
	r.Iteration = 0

	err := r.walk(config.WalkDir)

	if err != nil {
		log.Fatal(err)
	}

	// Process any remaining paths
	if len(r.Batch) > 0 {
		err = r.processBatch()
		if err != nil {
			fmt.Println("Error processing final batch:", err)
			return err
		}
	}

	if config.DeleteFiles {
		r.dropSegmentRows()
	}

	return nil
}

func (r *Reaper) walk(path string) error {
	entries, err := os.ReadDir(path)
	if err != nil {
		return fmt.Errorf("failed to read dir: %v", err)
	}

	for _, entry := range entries {
		filePath := filepath.Join(path, entry.Name())

		if entry.IsDir() {
			err = r.walk(filePath)
			if err != nil {
				fmt.Printf("error walking path %q: %v\n", filePath, err)
				continue
			}
		} else {
			// Be kind to disk i/o
			// time.Sleep(time.Millisecond * 2)
			r.Batch = append(r.Batch, filePath)

			if len(r.Batch) == BATCH_SIZE {
				err = r.processBatch()
				if err != nil {
					fmt.Println("Error processing r.Batch:", err)
					return err
				}
				r.Batch = r.Batch[:0] // Reset
			}
		}
	}
	return nil
}

func (r *Reaper) processBatch() error {

	r.Iteration++
	fmt.Println(fmt.Sprintf("Process batch: %d", r.Iteration))

	tableName := "Files"
	if r.Config.isTest {
		tableName = "FilesTest"
	}
	query := fmt.Sprintf(`SELECT DISTINCT "storagePath", "type" FROM "%s" WHERE "storagePath" = ANY($1)`, tableName)
	rows, err := r.DB.Query(query, pq.StringArray(r.Batch))
	if err != nil {
		return err
	}
	defer rows.Close()

	rowsInDBMap := make(map[string]FileRow)
	rowsNotInDB := make([]string, 0)

	for rows.Next() {
		var row FileRow
		err := rows.Scan(&row.StoragePath, &row.Type)
		if err != nil {
			log.Fatal(err)
		}
		rowsInDBMap[row.StoragePath] = row
	}

	for _, storagePath := range r.Batch {
		if _, found := rowsInDBMap[storagePath]; !found {
			rowsNotInDB = append(rowsNotInDB, storagePath)
		}
	}

	rowsInDB := make([]FileRow, 0, len(rowsInDBMap))

	for _, row := range rowsInDBMap {
		rowsInDB = append(rowsInDB, row)
	}

	err = rows.Err()
	if err != nil {
		return err
	}

	for _, filePath := range rowsNotInDB {
		r.handleFileNotInDB(filePath)
	}

	for _, row := range rowsInDB {
		r.handleFileInDB(row)
	}

	return nil
}

func (r *Reaper) handleFileNotInDB(filePath string) {
	defer func() {
		if rec := recover(); rec != nil {
			r.counter["not_in_db"]["error_count"]++
		}
	}()

	fileInfo, err := os.Stat(filePath)
	if err != nil {
		fmt.Println(err)
		r.counter["not_in_db"]["error_count"]++
		return
	}

	r.counter["not_in_db"]["count"]++
	r.counter["not_in_db"]["bytes_used"] += int(fileInfo.Size())

	r.Outfile.WriteString(filePath + "\n")

	if r.Config.DeleteFiles {
		removeFile(filePath)

		// Remove empty directories
		parentDir := filepath.Dir(filePath)
		for parentDir != r.Config.WalkDir {
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

func (r *Reaper) handleFileInDB(row FileRow) {
	defer func() {
		if rec := recover(); rec != nil {
			r.counter[row.Type]["error_count"]++
		}
	}()

	if contains(FILE_TYPES, row.Type) {
		fileInfo, err := os.Stat(row.StoragePath)
		if err != nil {
			r.counter[row.Type]["error_count"]++
			return
		}

		r.counter[row.Type]["count"]++
		r.counter[row.Type]["bytes_used"] += int(fileInfo.Size())

		// Segments
		if row.Type == "track" {
			if r.Config.DeleteFiles {
				removeFile(row.StoragePath)
			}
		}
	}
}

func (r *Reaper) dropSegmentRows() {
	tableName := "Files"
	if r.Config.isTest {
		tableName = "FilesTest"
	}
	query := fmt.Sprintf(`DELETE FROM "%s" WHERE "type" = 'track'`, tableName)

	res, err := r.DB.Exec(query)
	if err != nil {
		log.Fatal(err)
	}

	count, err := res.RowsAffected()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Deleted %d segment rows.\n", count)
}
