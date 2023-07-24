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
	"syscall"

	"github.com/lib/pq"
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
		// counter:   initCounter(),
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
	// Catch control+c so you can check things are working on a large fs without waiting
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-interrupt
		fmt.Printf("\ntrapped SIGINT...\n\n")
		b.report()
		os.Exit(0)
	}()
}

func Run() {

	_init() // Flag parsing in init() causes `go test` to fail

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

	b.report()
}

func (b *Batcher) Walk() error {

	b.counter = initCounter()

	var err error
	filePaths := make(chan string, BATCH_SIZE)

	go func() {
		defer close(filePaths)
		err := filepath.Walk(config.WalkDir, func(path string, info os.FileInfo, err error) error {
			// time.Sleep(time.Millisecond * 10) // chill io
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

	for filePath := range filePaths {
		b.Batch = append(b.Batch, filePath)

		if len(b.Batch) == BATCH_SIZE {
			err = b.processBatch()
			if err != nil {
				fmt.Println("Error processing b.Batch:", err)
				return err
			}
			b.Batch = b.Batch[:0] // Reset
		}
	}

	// Process any remaining paths
	if len(b.Batch) > 0 {
		err = b.processBatch()
		if err != nil {
			fmt.Println("Error processing final batch:", err)
			return err
		}
	}

	return nil
}

func (b *Batcher) processBatch() error {

	b.Iteration++
	fmt.Println(fmt.Sprintf("Process batch: %d", b.Iteration))

	tableName := "Files"
	if b.Config.isTest {
		tableName = "FilesTest"
	}
	query := fmt.Sprintf(`SELECT DISTINCT "storagePath", "type" FROM "%s" WHERE "storagePath" = ANY($1)`, tableName)
	rows, err := b.DB.Query(query, pq.StringArray(b.Batch))
	if err != nil {
		return err
	}
	defer rows.Close()

	rowsInDBMap := make(map[string]FileRow)
	rowsNotInDB := make([]string, BATCH_SIZE)

	for rows.Next() {
		var row FileRow
		err := rows.Scan(&row.StoragePath, &row.Type)
		if err != nil {
			log.Fatal(err)
		}
		rowsInDBMap[row.StoragePath] = row
	}

	for _, storagePath := range b.Batch {
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
		b.handleFileNotInDB(filePath)
	}

	for _, row := range rowsInDB {
		b.handleFileInDB(row)
	}

	return nil
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

func (b *Batcher) report() {
	gbNotInDB := float64(b.counter["not_in_db"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbSegments := float64(b.counter["track"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbCopy320 := float64(b.counter["copy320"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbImage := float64(b.counter["image"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbMetadata := float64(b.counter["metadata"]["bytes_used"]) / (1024 * 1024 * 1024)
	gbDir := float64(b.counter["dir"]["bytes_used"]) / (1024 * 1024 * 1024)
	totalGBUsed := gbNotInDB + gbSegments + gbCopy320 + gbImage + gbMetadata + gbDir

	fmt.Printf("NOT IN DB COUNT  : %d\n", b.counter["not_in_db"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["not_in_db"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbNotInDB)
	fmt.Printf("SEGMENTS  COUNT  : %d\n", b.counter["track"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["track"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbSegments)
	fmt.Printf("COPY320   COUNT  : %d\n", b.counter["copy320"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["copy320"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbCopy320)
	fmt.Printf("IMAGE     COUNT  : %d\n", b.counter["image"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["image"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbImage)
	fmt.Printf("METADATA  COUNT  : %d\n", b.counter["metadata"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["metadata"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbMetadata)
	fmt.Printf("DIR       COUNT  : %d\n", b.counter["dir"]["count"])
	fmt.Printf("          ERRORS : %d\n", b.counter["dir"]["error_count"])
	fmt.Printf("          GB USED: %.2f\n\n", gbDir)
	fmt.Printf("-----------------------\n")
	fmt.Printf("TOTAL     GB USED: %.2f\n", totalGBUsed)
	fmt.Printf("-----------------------\n")
}
