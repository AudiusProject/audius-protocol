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
)

var (
	FILE_TYPES = []string{"track", "copy320", "metadata", "image", "dir", "not_in_db"}
	counter    = make(map[string]map[string]int)
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
}

func init() {
	for _, fileType := range FILE_TYPES {
		counter[fileType] = make(map[string]int)
		counter[fileType]["count"] = 0
		counter[fileType]["error_count"] = 0
		counter[fileType]["bytes_used"] = 0
	}
}

func RunMain(_runConfig Config) {
	// TODO: init config
	config = _runConfig

	dbUrl := os.Getenv("dbUrl")
	if dbUrl == "" {
		dbUrl = "postgres://postgres:example@localhost:5454/m1"
	}

	// TODO: fix
	var err error
	conn, err = sql.Open("postgres", fmt.Sprintf("%s?sslmode=disable", dbUrl))
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	outfile, err = os.Create(filepath.Join(config.LogDir, "files_on_disk_not_in_db.txt"))
	if err != nil {
		log.Fatal(err)
	}
	defer outfile.Close()

	batcher := NewBatcher()

	err = batcher.Walk(config.WalkDir, config.MoveFiles)
	if err != nil {
		log.Fatal(err)
	}

	reportAndExit()
}

type Batcher struct {
	Conn      *sql.DB
	Outfile   *os.File
	Iteration int
	Batch     []string
}

func NewBatcher() *Batcher {
	return &Batcher{
		Conn:      conn,
		Outfile:   outfile,
		Iteration: 0,
		Batch:     make([]string, 0, BATCH_SIZE),
	}
}

func (b *Batcher) test() {

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

	// TODO test for duplicates
	query := `
		DROP TABLE IF EXISTS "FilesTest";
		CREATE TABLE "FilesTest" (
			"storagePath" TEXT,
			type TEXT
		)`

	_, err := b.Conn.Exec(query)
	if err != nil {
		log.Fatal("Failed to create table:", err)
	}

	// see ./reaper/test/to_walk
	data := []FileRow{
		{StoragePath: "/tmp/reaper/to_walk/111/Qmaaa", Type: "track"},
		{StoragePath: "/tmp/reaper/to_walk/111/Qmbbb", Type: "track"},
		{StoragePath: "/tmp/reaper/to_walk/111/Qmccc", Type: "copy320"},
		{StoragePath: "/tmp/reaper/to_walk/222/Qmaaa", Type: "track"},
		{StoragePath: "/tmp/reaper/to_walk/222/Qmbbb", Type: "track"},
		{StoragePath: "/tmp/reaper/to_walk/222/Qmccc", Type: "copy320"},
		{StoragePath: "/tmp/reaper/to_walk/333/Qmaaa", Type: "track"},
		{StoragePath: "/tmp/reaper/to_walk/333/Qmbbb", Type: "track"},
		{StoragePath: "/tmp/reaper/to_walk/333/Qmccc", Type: "copy320"},
	}

	for _, row := range data {
		_, err := b.Conn.Exec("INSERT INTO \"FilesTest\" (\"storagePath\", type) VALUES ($1, $2)", row.StoragePath, row.Type)
		if err != nil {
			log.Println("Failed to insert row:", err)
		}
	}
}

func (b *Batcher) Walk(directory string, moveFiles bool) error {

	// TODO if --test
	// setup fixture data
	b.test()
	// end TODO

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
	query := fmt.Sprintf("SELECT \"storagePath\", \"type\" FROM \"FilesTest\" WHERE \"storagePath\" IN (%s)", pathsSQL)
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
			counter["not_in_db"]["error_count"]++
		}
	}()

	fileInfo, err := os.Stat(filePath)
	if err != nil {
		counter["not_in_db"]["error_count"]++
		return
	}

	counter["not_in_db"]["count"]++
	counter["not_in_db"]["bytes_used"] += int(fileInfo.Size())

	b.Outfile.WriteString(filePath + "\n")

	if moveFiles {
		// Move file to a staging delete directory
		// Retain all subdirs in case we want to move back before deleting
		moveFile(filePath, filepath.Join(filepath.Join(config.MoveDir, "not_in_db"), filePath))

		// Remove empty directories
		parentDir := filepath.Dir(filePath)
		for parentDir != config.WalkDir {
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
			counter[row.Type]["error_count"]++
		}
	}()

	if contains(FILE_TYPES, row.Type) {
		fileInfo, err := os.Stat(row.StoragePath)
		if err != nil {
			counter[row.Type]["error_count"]++
			return
		}

		counter[row.Type]["count"]++
		counter[row.Type]["bytes_used"] += int(fileInfo.Size())

		// segments
		if row.Type == "track" {
			if config.MoveFiles {
				// Move file to a staging delete directory
				// Retain all subdirs in case we want to move back before deleting
				moveFile(row.StoragePath, filepath.Join(filepath.Join(config.MoveDir, "track"), row.StoragePath))
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
		return err
	}

	err = os.Rename(source, destination)
	if err != nil {
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

func reportAndExit() {
	gbNotInDB := float64(counter["not_in_db"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbSegments := float64(counter["track"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbCopy320 := float64(counter["copy320"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbImage := float64(counter["image"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbMetadata := float64(counter["metadata"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbDir := float64(counter["dir"]["bytes_used"]) / (1024 * 1024 * 1024)

	fmt.Printf("NOT IN DB COUNT  : %d\n", counter["not_in_db"]["count"])
	fmt.Printf("          GB USED: %.2f\n", gbNotInDB)
	fmt.Printf("SEGMENTS  COUNT  : %d\n", counter["track"]["count"])
	fmt.Printf("          GB USED: %.2f\n", gbSegments)
	fmt.Printf("COPY320   COUNT  : %d\n", counter["copy320"]["count"])
	fmt.Printf("          GB USED: %.2f\n", gbCopy320)
	fmt.Printf("IMAGE     COUNT  : %d\n", counter["image"]["count"])
	fmt.Printf("          GB USED: %.2f\n", gbImage)
	fmt.Printf("METADATA  COUNT  : %d\n", counter["metadata"]["count"])
	fmt.Printf("          GB USED: %.2f\n", gbMetadata)
	fmt.Printf("DIR       COUNT  : %d\n", counter["dir"]["count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbDir)

	totalGBUsed := gbNotInDB + gbSegments + gbCopy320 + gbImage + gbMetadata + gbDir
	fmt.Printf("TOTAL     GB USED: %.2f\n", totalGBUsed)

	os.Exit(0)
}
