package reaper

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
)

const (
	NOT_IN_DB_LOG_FILE = "files_on_disk_not_in_db.txt"
	BATCH_SIZE         = 1000
	IS_TEST            = true
)

var (
	FILE_TYPES = []string{"track", "copy320", "metadata", "image", "dir", "not_in_db"}
	conn       *sql.DB
	outfile    *os.File
	config     Config
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
	isTest    bool `default:"false"`
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

func RunMain(_runConfig Config) {
	// TODO: init config
	// config = _runConfig

	// dbUrl := os.Getenv("dbUrl")
	// if dbUrl == "" {
	// 	dbUrl = "postgres://postgres:example@localhost:5454/m1"
	// }

	// // TODO: fix
	// var err error
	// conn, err = sql.Open("postgres", fmt.Sprintf("%s?sslmode=disable", dbUrl))
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// defer conn.Close()

	// outfile, err = os.Create(filepath.Join(config.LogDir, "files_on_disk_not_in_db.txt"))
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// defer outfile.Close()

	// // batcher := NewBatcher(&config)
	// batcher := NewBatcher(conn, &config)

	// err = batcher.Walk(config.WalkDir, config.MoveFiles)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// reportAndExit()
}

type Batcher struct {
	Conn      *sql.DB
	Outfile   *os.File
	Iteration int
	Batch     []string
	Config    *Config
	counter   map[string]map[string]int
}

// func NewBatcher(c *Config) *Batcher {
func NewBatcher(conn *sql.DB, config *Config) *Batcher {
	return &Batcher{
		Conn:      conn,
		Outfile:   outfile,
		Iteration: 0,
		Batch:     make([]string, 0, BATCH_SIZE),
		Config:    config,
		counter:   initCounter(),
	}
}

func (b *Batcher) Walk(directory string, moveFiles bool) error {

	err := filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.Mode().IsRegular() {
			b.Batch = append(b.Batch, path)

			if len(b.Batch) == BATCH_SIZE {
				b.handleBatch(moveFiles)
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	if len(b.Batch) > 0 {
		b.handleBatch(moveFiles)
	}

	return nil
}

func (b *Batcher) handleBatch(moveFiles bool) {
	b.Iteration++
	fmt.Printf("iteration:        %d\n", b.Iteration)

	rowsInDB, rowsNotInDB := b.checkDB()
	fmt.Printf("files_in_db:      %d\n", len(rowsInDB))
	fmt.Printf("files_not_in_db:  %d\n\n", len(rowsNotInDB))

	for _, filePath := range rowsNotInDB {
		b.handleFileNotInDB(filePath, moveFiles)
	}

	for _, row := range rowsInDB {
		b.handleFileInDB(row)
	}

	b.Batch = b.Batch[:0]
}

func (b *Batcher) checkDB() ([]FileRow, []string) {
	pathsSQL := strings.Join(quoteStrings(b.Batch), ",")
	tableName := "Files"
	if IS_TEST {
		tableName = "FilesTest"
	}
	query := fmt.Sprintf("SELECT \"storagePath\", \"type\" FROM \"%s\" WHERE \"storagePath\" IN (%s)", tableName, pathsSQL)
	rows, err := b.Conn.Query(query)
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

func (b *Batcher) handleFileNotInDB(filePath string, moveFiles bool) {
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

	if moveFiles {
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

func quoteStrings(strings []string) []string {
	quotedStrings := make([]string, len(strings))
	for i, str := range strings {
		quotedStrings[i] = fmt.Sprintf("'%s'", str)
	}
	return quotedStrings
}

func removeEmptyStrings(strings []string) []string {
	filteredStrings := make([]string, 0)
	for _, str := range strings {
		if str != "" {
			filteredStrings = append(filteredStrings, str)
		}
	}
	return filteredStrings
}

func contains(strings []string, str string) bool {
	for _, s := range strings {
		if s == str {
			return true
		}
	}
	return false
}

func moveFile(source, destination string) error {
	err := os.MkdirAll(filepath.Dir(destination), 0755)
	if err != nil {
		log.Fatal(err)
		return err
	}

	// fmt.Println("moving from:", source, destination)
	err = os.Rename(source, destination)
	if err != nil {
		log.Fatal(err)
		return err
	}

	return nil
}

func isDirectoryEmpty(dirPath string) (bool, error) {
	dir, err := os.Open(dirPath)
	if err != nil {
		return false, err
	}
	defer dir.Close()

	_, err = dir.Readdirnames(1)
	if err == io.EOF {
		return true, nil
	}

	return false, err
}

func report(b *Batcher) {
	gbNotInDB := float64(b.counter["not_in_db"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbSegments := float64(b.counter["track"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbCopy320 := float64(b.counter["copy320"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbImage := float64(b.counter["image"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbMetadata := float64(b.counter["metadata"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbDir := float64(b.counter["dir"]["bytes_used"]) / (1024 * 1024 * 1024)

	fmt.Printf("NOT IN DB COUNT  : %d\n", b.counter["not_in_db"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["not_in_db"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n", gbNotInDB)
	fmt.Printf("SEGMENTS  COUNT  : %d\n", b.counter["track"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["track"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n", gbSegments)
	fmt.Printf("COPY320   COUNT  : %d\n", b.counter["copy320"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["copy320"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n", gbCopy320)
	fmt.Printf("IMAGE     COUNT  : %d\n", b.counter["image"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["image"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n", gbImage)
	fmt.Printf("METADATA  COUNT  : %d\n", b.counter["metadata"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["metadata"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n", gbMetadata)
	fmt.Printf("DIR       COUNT  : %d\n", b.counter["dir"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["dir"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbDir)

	totalGBUsed := gbNotInDB + gbSegments + gbCopy320 + gbImage + gbMetadata + gbDir
	fmt.Printf("TOTAL     GB USED: %.2f\n", totalGBUsed)
}
