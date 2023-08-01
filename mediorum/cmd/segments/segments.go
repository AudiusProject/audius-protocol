package segments

import (
	"bufio"
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	_ "github.com/lib/pq"
)

const (
	batchSize = 1000
)

type mediorumClient struct {
	db     *sql.DB
	isTest bool
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

func newMediorumClient() (*mediorumClient, error) {

	dbUrl := os.Getenv("dbUrl")
	if dbUrl == "" {
		dbUrl = "postgres://postgres:example@localhost:5454/m1"
	}

	db, err := sql.Open("postgres", fmt.Sprintf("%s?sslmode=disable", dbUrl))
	if err != nil {
		return nil, err
	}

	return &mediorumClient{
		db: db,
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

func (m *mediorumClient) scanForSegments() (string, error) {

	fmt.Println("scanForSegments")

	tableName := "Files"
	if m.isTest {
		tableName = "FilesTest"
	}
	rows, err := m.db.Query(fmt.Sprintf(`SELECT "storagePath" FROM "%s" where "type" = 'track';`, tableName))
	if err != nil {
		log.Fatalf("Failed to execute query: %v", err)
	}
	defer rows.Close()

	outfileName := "segments-output.txt"
	if m.isTest {
		outfileName = "segments_test-output.txt"
	}
	outfile, err := os.Create(outfileName)
	if err != nil {
		log.Fatalf("Failed to create output file: %v", err)
	}

	writer := bufio.NewWriter(outfile)

	batch := make([]string, 0, batchSize)
	for rows.Next() {
		var fileLocation string
		if err := rows.Scan(&fileLocation); err != nil {
			log.Fatalf("Failed to scan row: %v", err)
		}

		batch = append(batch, fileLocation)
		if len(batch) >= batchSize {
			m.processBatch(batch, writer)
			batch = batch[:0]
		}
	}

	if err := rows.Err(); err != nil {
		log.Fatalf("Rows iteration error: %v", err)
	}

	// process remaining batch if any
	if len(batch) > 0 {
		m.processBatch(batch, writer)
	}

	path, err := filepath.Abs(outfile.Name())
	if err != nil {
		fmt.Println(err)
		return "", err
	}

	if err = writer.Flush(); err != nil {
		return path, err
	}

	if err = outfile.Close(); err != nil {
		return path, err
	}

	fmt.Println()

	return path, nil
}

func (m *mediorumClient) processBatch(batch []string, writer *bufio.Writer) {
	fmt.Printf(".")
	for _, fileLocation := range batch {
		if _, err := os.Stat(fileLocation); err == nil {
			if _, err := fmt.Fprintln(writer, fileLocation); err != nil {
				log.Fatalf("Failed to write to output file: %v", err)
			}
		}
	}
}

func (m *mediorumClient) deleteSegmentsAndRows(filepath string) error {
	fmt.Println("deleteSegmentsAndRows")

	file, err := os.Open(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	var batch []string
	for scanner.Scan() {
		batch = append(batch, scanner.Text())
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

	if err := scanner.Err(); err != nil {
		return err
	}

	fmt.Println()

	return nil
}

func (m *mediorumClient) deleteBatch(batch []string) error {
	fmt.Printf(".")
	tx, err := m.db.Begin()
	if err != nil {
		return err
	}

	tableName := "Files"
	if m.isTest {
		tableName = "FilesTest"
	}
	stmt, err := tx.Prepare(fmt.Sprintf(`DELETE FROM "%s" WHERE "storagePath" = $1`, tableName))
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, path := range batch {
		if _, err := os.Stat(path); err == nil {
			if err := os.Remove(path); err != nil {
				tx.Rollback()
				return err
			}

			if _, err := stmt.Exec(path); err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}

func Run(delete bool) {
	var (
		err            error
		m              *mediorumClient
		outputFilepath string
	)

	if !delete {
		fmt.Println("Performing dry run. Use `--delete` to remove segment files and rows.")
	}

	m, err = newMediorumClient()
	defer m.close()

	outputFilepath, err = m.scanForSegments()
	if err != nil {
		log.Fatalf("Failed to call segments.Run(): %v", err)
	}

	if delete {
		err = m.deleteSegmentsAndRows(outputFilepath)
		if err != nil {
			log.Fatalf("Failed to delete segments and rows: %v", err)
		}

		fmt.Println("Completed deletion of segments and rows.")
	}
}
