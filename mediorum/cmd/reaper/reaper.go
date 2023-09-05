package reaper

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var rootPath string

func deleteFilesAndEmptyDirs(path string, logFile *os.File) error {

	if rootPath == "" {
		rootPath = path
	}

	entries, err := os.ReadDir(path)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		childPath := filepath.Join(path, entry.Name())
		if entry.IsDir() {
			if err := deleteFilesAndEmptyDirs(childPath, logFile); err != nil {
				return err
			}
		} else {
			if err := os.Remove(childPath); err != nil {
				log.Printf("Failed to delete file: %s, error: %s", childPath, err)
				return err
			}
			time.Sleep(100 * time.Millisecond)
		}
	}

	if path != rootPath {
		if err := os.Remove(path); err != nil {
			log.Printf("Failed to delete directory: %s, error: %s", path, err)
			return err
		}
	}

	return nil
}

func Run() {

	logFile, err := os.OpenFile("/tmp/mediorum/reaper.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		fmt.Printf("Error opening log file: %v\n", err)
		return
	}
	defer logFile.Close()
	log.SetOutput(logFile)

	if _, exists := os.LookupEnv("NO_LEGACY_REAPER"); exists || strings.HasSuffix(os.Getenv("creatorNodeEndpoint"), ".audius.co") {
		log.Printf("Skipping deletion due to NO_LEGACY_REAPER env var present.")
		log.Printf("Sleeping.")
		time.Sleep(10000 * time.Hour)
		return
	}

	log.Printf("Start: %s", time.Now())

	err = deleteFilesAndEmptyDirs("/file_storage", logFile)
	if err != nil {
		log.Printf("Err  : %s", err)
	}

	log.Printf("End  : %s", time.Now())
}
