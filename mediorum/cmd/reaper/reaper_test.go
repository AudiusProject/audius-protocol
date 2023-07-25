package reaper

import (
	"fmt"
	"log"
	"reflect"
	"testing"
)

func init() {
	fmt.Println("reaper_test.go init() called")

	BATCH_SIZE = 3

	config = &Config{
		DeleteFiles: true,
		WalkDir:     "/tmp/reaper_test/to_walk",
		LogDir:      "/tmp/reaper_test/logs",
		isTest:      true,
		dbUrl:       dbUrl,
	}

	fmt.Printf("config: %+v\n", config)
}

func TestReaper(t *testing.T) {

	var (
		r   *Reaper
		err error
	)

	r, err = NewReaper(config)
	if err != nil {
		log.Fatal(err)
	}
	defer r.Close()

	err = r.generateTestFixtures()
	if err != nil {
		log.Fatal(err)
	}

	// before - drop segments and unreferenced files
	r.Walk()
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

	if !reflect.DeepEqual(expected, r.counter) {
		t.Errorf("Maps are not equal. Expected: %v, Actual: %v", expected, r.counter)
	} else {
		r.report()
	}

	// after - did the files actually get deleted
	r.Walk()
	expected = map[string]map[string]int{
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
			"count":       0,
			"error_count": 0,
		},
		"track": {
			"bytes_used":  0,
			"count":       0,
			"error_count": 0,
		},
	}

	if !reflect.DeepEqual(expected, r.counter) {
		t.Errorf("Maps are not equal. Expected: %v, Actual: %v", expected, r.counter)
	} else {
		r.report()
	}

	// did the segment rows get removed from the db
	query := `SELECT COUNT(*) FROM "FilesTest" WHERE "type" = 'track'`
	var count int
	err = r.DB.QueryRow(query).Scan(&count)
	if count != 0 {
		t.Errorf("Segment rows not removed. Expected: %v, Actual: %v", 0, count)
	}
}
