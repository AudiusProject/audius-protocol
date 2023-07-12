package reaper

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"testing"
)

func init() {
	fmt.Println("reaper_test.go init() called")

	// config
	config = &Config{
		MoveFiles: true,
		MoveDir:   "/tmp/reaper_test/to_delete",
		WalkDir:   "/tmp/reaper_test/to_walk",
		LogDir:    "/tmp/reaper_test/logs",
		isTest:    true,
		dbUrl:     dbUrl,
	}
	fmt.Printf("config: %+v\n", config)

	// fixture files
	cmd := exec.Command("cp", "-r", "./fixtures/", "/tmp/reaper_test")
	_, err := cmd.Output()
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

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

func TestReaper(t *testing.T) {

	var (
		b   *Batcher
		err error
	)

	b, err = NewBatcher(config)
	if err != nil {
		log.Fatal(err)
	}
	defer b.Close()

	query := `
	DROP TABLE IF EXISTS "FilesTest";
	CREATE TABLE "FilesTest" (
		"storagePath" TEXT,
		type TEXT
	)`

	_, err = b.DB.Exec(query)
	if err != nil {
		log.Fatal("Failed to create table: ", err)
	}

	data := []FileRow{
		{StoragePath: fmt.Sprintf("%s/111/Qmaaa", config.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/111/Qmbbb", config.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/111/Qmccc", config.WalkDir), Type: "copy320"},
		{StoragePath: fmt.Sprintf("%s/222/Qmaaa", config.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/222/Qmbbb", config.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/222/Qmccc", config.WalkDir), Type: "copy320"},
		{StoragePath: fmt.Sprintf("%s/333/Qmaaa", config.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/333/Qmbbb", config.WalkDir), Type: "track"},
		{StoragePath: fmt.Sprintf("%s/333/Qmccc", config.WalkDir), Type: "copy320"},
	}

	for _, row := range data {
		_, err := b.DB.Exec("INSERT INTO \"FilesTest\" (\"storagePath\", type) VALUES ($1, $2)", row.StoragePath, row.Type)
		if err != nil {
			log.Println("Failed to insert row: ", err)
		}
	}

	b.Walk()

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
