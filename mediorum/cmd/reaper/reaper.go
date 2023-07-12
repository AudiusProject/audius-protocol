package reaper

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
)

var (
	FILE_TYPES = []string{"track", "copy320", "metadata", "image", "dir", "not_in_db"}
	config     *Config
	dbUrl      string
	reaperCmd  *flag.FlagSet
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
	isTest    bool `default:"false"`
	batchSize int  `default:"1000"`
}

type Batcher struct {
	DB        *sql.DB
	Outfile   *os.File
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

	outfile, err = os.Create(filepath.Join(config.LogDir, "files_on_disk_not_in_db.txt"))
	if err != nil {
		return nil, err
	}

	return &Batcher{
		DB:        db,
		Outfile:   outfile,
		Iteration: 0,
		Batch:     make([]string, 0, config.batchSize),
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

	dbUrl = os.Getenv("dbUrl")
	if dbUrl == "" {
		dbUrl = "postgres://postgres:example@localhost:5454/m1"
	}
}

func _init() {
	// parsing these flags in init() causes `go test` to fail
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

	moveDirs := []string{
		filepath.Join(config.MoveDir, "not_in_db"),
		filepath.Join(config.MoveDir, "track"),
		config.WalkDir,
		config.LogDir,
	}

	for _, dir := range moveDirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			err := os.MkdirAll(dir, 0755)
			if err != nil {
				fmt.Println("Failed to create directory:", err)
				return
			}
		}
	}
}

func main() {
	fmt.Println("reaper.go main() called")
}

func RunMain() {

	_init()

	var (
		b   *Batcher
		err error
	)

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

func (b *Batcher) Walk() error {

	err := filepath.Walk(b.Config.WalkDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.Mode().IsRegular() {
			b.Batch = append(b.Batch, path)

			if len(b.Batch) == b.Config.batchSize {
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
	b.Iteration++
	fmt.Printf("iteration:        %d\n", b.Iteration)

	rowsInDB, rowsNotInDB := b.checkDB()
	fmt.Printf("files_in_db:      %d\n", len(rowsInDB))
	fmt.Printf("files_not_in_db:  %d\n\n", len(rowsNotInDB))

	for _, filePath := range rowsNotInDB {
		b.handleFileNotInDB(filePath)
	}

	for _, row := range rowsInDB {
		b.handleFileInDB(row)
	}

	b.Batch = b.Batch[:0]
}

func (b *Batcher) checkDB() ([]FileRow, []string) {
	pathsSQL := strings.Join(quoteStrings(b.Batch), ",")
	tableName := "Files"
	if config.isTest {
		tableName = "FilesTest"
	}
	query := fmt.Sprintf("SELECT \"storagePath\", \"type\" FROM \"%s\" WHERE \"storagePath\" IN (%s)", tableName, pathsSQL)
	rows, err := b.DB.Query(query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	rowsInDB := make([]FileRow, 0)
	rowsNotInDB := make([]string, len(b.Batch))
	copy(rowsNotInDB, b.Batch)

	for rows.Next() {
		var row FileRow
		err := rows.Scan(&row.StoragePath, &row.Type)
		if err != nil {
			log.Fatal(err)
		}

		rowsInDB = append(rowsInDB, row)

		for i, path := range rowsNotInDB {
			if path == row.StoragePath {
				rowsNotInDB[i] = ""
				break
			}
		}
	}

	return rowsInDB, removeEmptyStrings(rowsNotInDB)
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

		// segments
		if row.Type == "track" {
			if b.Config.MoveFiles {
				// Move file to a staging delete directory
				// Retain all subdirs in case we want to move back before deleting
				moveFile(row.StoragePath, filepath.Join(filepath.Join(b.Config.MoveDir, "track"), row.StoragePath))
			}
		}
	}
}
