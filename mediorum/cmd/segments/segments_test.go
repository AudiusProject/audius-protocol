package segments

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"testing"
)

type FileRow struct {
	StoragePath string
	Type        string
}

func generateTestFixtures(m *mediorumClient) {

	var err error

	baseDir := "/tmp/mediorum_test"
	directories := []string{"111", "222", "333", "444", "555", "666", "777"}
	files := []string{"Qmaaa", "Qmbbb", "Qmccc"}
	types := []string{"track", "track", "copy320"}

	data := []FileRow{}

	for _, dir := range directories {
		dirPath := filepath.Join(baseDir, dir)

		err := os.MkdirAll(dirPath, os.ModePerm)
		if err != nil {
			log.Fatal(err)
		}

		for i, fileName := range files {
			absPath := filepath.Join(dirPath, fmt.Sprintf("%s-%s", fileName, types[i]))
			file, err := os.Create(absPath)
			if err != nil {
				log.Fatal(err)
			}
			defer file.Close()

			data = append(data, FileRow{StoragePath: absPath, Type: types[i]})
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

	for _, row := range data {
		_, err := m.db.Exec(`INSERT INTO "FilesTest" ("storagePath", "type") VALUES ($1, $2)`, row.StoragePath, row.Type)
		if err != nil {
			log.Fatal(err)
		}
	}
}

func TestDropSegments(t *testing.T) {

	NUM_FIXTURES := 21
	NUM_SEGMENTS := 14

	var (
		err error
		m   *mediorumClient
	)

	c := &MediorumClientConfig{
		Delete: true,
		isTest: true,
	}

	m, err = newMediorumClient(c)
	if err != nil {
		log.Fatalf("Failed to create mediorumClient: %v", err)
	}
	m.isTest = true
	defer m.close()

	generateTestFixtures(m)

	Run(c)

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
