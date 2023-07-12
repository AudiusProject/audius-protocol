package reaper

import (
	"fmt"
	"log"
	"reflect"
	"testing"
)

func init() {
	fmt.Println("reaper_test.go init() called")

	config = &Config{
		MoveFiles: true,
		MoveDir:   "/tmp/reaper_test/to_delete",
		WalkDir:   "/tmp/reaper_test/to_walk",
		LogDir:    "/tmp/reaper_test/logs",
		isTest:    true,
		dbUrl:     dbUrl,
	}

	fmt.Printf("config: %+v\n", config)
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

	err = generateTestFixtures(b)
	if err != nil {
		log.Fatal(err)
	}

	b.Walk()

	// before
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

	b.counter = initCounter()
	b.Walk()

	// after
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

	if !reflect.DeepEqual(expected, b.counter) {
		t.Errorf("Maps are not equal. Expected: %v, Actual: %v", expected, b.counter)
	} else {
		report(b)
	}

}
