package segments

import (
	"bufio"
	"log"
	"os"
	"path/filepath"
	"testing"
)

type FileRow struct {
	StoragePath string
	Type        string
}

func newMediorumTestClient() (*mediorumClient, error) {
	m, err := newMediorumClient()
	if err != nil {
		return m, err
	}
	m.isTest = true

	baseDir := "/tmp/mediorum_test"
	directories := []string{"111", "222", "333", "444"}
	files := []string{"Qmaaa-segment", "Qmbbb-segment", "Qmccc-copy320"}

	for _, dir := range directories {
		dirPath := filepath.Join(baseDir, dir)

		err := os.MkdirAll(dirPath, os.ModePerm)
		if err != nil {
			log.Fatal(err)
		}

		for _, fileName := range files {
			file, err := os.Create(filepath.Join(dirPath, fileName))
			if err != nil {
				log.Fatal(err)
			}
			defer file.Close()
		}
	}

	query := `
	DROP TABLE IF EXISTS "FilesTest";
	CREATE TABLE "FilesTest" (
		"storagePath" TEXT,
		type TEXT
	)`

	_, err = m.db.Exec(query)
	if err != nil {
		log.Fatal("Failed to create table: ", err)
	}

	data := []FileRow{
		{StoragePath: filepath.Join(baseDir, "111/Qmaaa-segment"), Type: "track"},
		{StoragePath: filepath.Join(baseDir, "111/Qmbbb-segment"), Type: "track"},
		{StoragePath: filepath.Join(baseDir, "111/Qmccc-copy320"), Type: "copy320"},
		{StoragePath: filepath.Join(baseDir, "222/Qmaaa-segment"), Type: "track"},
		{StoragePath: filepath.Join(baseDir, "222/Qmbbb-segment"), Type: "track"},
		{StoragePath: filepath.Join(baseDir, "222/Qmccc-copy320"), Type: "copy320"},
		{StoragePath: filepath.Join(baseDir, "333/Qmaaa-segment"), Type: "track"},
		{StoragePath: filepath.Join(baseDir, "333/Qmbbb-segment"), Type: "track"},
		{StoragePath: filepath.Join(baseDir, "333/Qmccc-copy320"), Type: "copy320"},
		{StoragePath: filepath.Join(baseDir, "444/Qmaaa-segment"), Type: "track"},
		{StoragePath: filepath.Join(baseDir, "444/Qmbbb-segment"), Type: "track"},
		{StoragePath: filepath.Join(baseDir, "444/Qmccc-copy320"), Type: "copy320"},
	}

	for _, row := range data {
		_, err := m.db.Exec(`INSERT INTO "FilesTest" ("storagePath", "type") VALUES ($1, $2)`, row.StoragePath, row.Type)
		if err != nil {
			log.Fatal(err)
		}
	}

	return m, nil
}

func TestDropSegments(t *testing.T) {

	NUM_FIXTURES := 12
	NUM_SEGMENTS := 8

	var (
		err            error
		m              *mediorumClient
		outputFilepath string
		actual         int
	)

	m, err = newMediorumTestClient()
	defer m.close()

	outputFilepath, err = m.scanForSegments()
	if err != nil {
		t.Errorf("scanForSegments fail: %v", err)
	}

	file, err := os.Open(outputFilepath)
	if err != nil {
		t.Fatalf("Failed to open file: %v", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	actual = 0
	for scanner.Scan() {
		actual++
	}

	if err := scanner.Err(); err != nil {
		t.Fatalf("Failed to read file: %v", err)
	}

	if actual != NUM_SEGMENTS {
		t.Errorf("Expected line count to be %d, but got %d", NUM_SEGMENTS, actual)
	}

	m.deleteSegmentsAndRows(outputFilepath)
	if err != nil {
		log.Fatalf("Failed to delete segments and rows: %v", err)
	}

	var count int
	err = m.db.QueryRow(`SELECT COUNT(*) FROM "FilesTest"`).Scan(&count)
	if err != nil {
		log.Fatalf("Failed to count rows: %v", err)
	}

	expected := NUM_FIXTURES - NUM_SEGMENTS
	if count != expected {
		log.Fatalf("Expected row count to be %d, but got %d", expected, count)
	}
}
