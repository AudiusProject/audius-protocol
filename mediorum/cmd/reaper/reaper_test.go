package reaper

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"testing"
)

var (
	testConfig Config
)

func init() {
	// config
	testConfig = Config{
		MoveFiles: true,
		MoveDir:   "/tmp/reaper/to_delete",
		WalkDir:   "/tmp/reaper/to_walk",
		LogDir:    "/tmp/reaper/logs",
		isTest:    true,
	}
	fmt.Printf("config: %+v\n", testConfig)

	// fixture files
	cmd := exec.Command("cp", "-r", "./fixtures/", "/tmp/reaper")
	_, err := cmd.Output()
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	moveDirs := []string{
		filepath.Join(testConfig.MoveDir, "not_in_db"),
		filepath.Join(testConfig.MoveDir, "track"),
		testConfig.WalkDir,
		testConfig.LogDir,
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

func TestReaper(t *testing.T) {

	dbUrl := os.Getenv("dbUrl")
	if dbUrl == "" {
		dbUrl = "postgres://postgres:example@localhost:5454/m1"
	}

	var err error
	conn, err := sql.Open("postgres", fmt.Sprintf("%s?sslmode=disable", dbUrl))
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	// // b := NewBatcher(&testConfig)
	b := NewBatcher(conn, &testConfig)

	// fixture db data
	// TODO test for duplicates
	query := `
	DROP TABLE IF EXISTS "FilesTest";
	CREATE TABLE "FilesTest" (
		"storagePath" TEXT,
		type TEXT
	)`

	_, err2 := b.Conn.Exec(query)
	if err2 != nil {
		log.Fatal("Failed to create table:", err)
	}

	data := []FileRow{
		{StoragePath: fmt.Sprintf("%s/111/Qmaaa", testConfig.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/111/Qmbbb", testConfig.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/111/Qmccc", testConfig.WalkDir), Type: "copy320"},
		{StoragePath: fmt.Sprintf("%s/222/Qmaaa", testConfig.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/222/Qmbbb", testConfig.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/222/Qmccc", testConfig.WalkDir), Type: "copy320"},
		{StoragePath: fmt.Sprintf("%s/333/Qmaaa", testConfig.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/333/Qmbbb", testConfig.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/333/Qmccc", testConfig.WalkDir), Type: "copy320"},
	}

	for _, row := range data {
		_, err := b.Conn.Exec("INSERT INTO \"FilesTest\" (\"storagePath\", type) VALUES ($1, $2)", row.StoragePath, row.Type)
		if err != nil {
			log.Println("Failed to insert row:", err)
		}
	}

	b.Walk(testConfig.WalkDir, true)

	expected := map[string]map[string]int{
		"copy320": {
			"bytes_used":  0,
			"count":       3,
			"error_count": 0,
		},
		"dir": {
			"bytes_used":  0,
			"count":       0,
			"error_count": 0,
		},
		"image": {
			"bytes_used":  0,
			"count":       0,
			"error_count": 0,
		},
		"metadata": {
			"bytes_used":  0,
			"count":       0,
			"error_count": 0,
		},
		"not_in_db": {
			"bytes_used":  0,
			"count":       3,
			"error_count": 0,
		},
		"track": {
			"bytes_used":  0,
			"count":       6,
			"error_count": 0,
		},
	}

	if !reflect.DeepEqual(expected, b.counter) {
		t.Errorf("Maps are not equal. Expected: %v, Actual: %v", expected, b.counter)
	} else {
		report(b)
	}

}
