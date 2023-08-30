package reaper

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func deleteFilesAndEmptyDirs(path string, logFile *os.File) error {
	log.SetOutput(logFile)

	if _, exists := os.LookupEnv("NO_LEGACY_REAPER"); exists || strings.HasSuffix(os.Getenv("creatorNodeEndpoint"), ".audius.co") {
		log.Printf("Skipping deletion due to NO_LEGACY_REAPER env var present.")
		log.Printf("Sleeping.")
		time.Sleep(10000 * time.Hour)
		return nil
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
			time.Sleep(500 * time.Millisecond)
		}
	}

	if err := os.Remove(path); err != nil {
		log.Printf("Failed to delete directory: %s, error: %s", path, err)
		return err
	}
	log.Printf("Deleted directory %s", path)

	return nil
}

func Run() {
	logFile, err := os.OpenFile("/tmp/mediorum/reaper.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		fmt.Printf("Error opening log file: %v\n", err)
		return
	}
	defer logFile.Close()

	deleteFilesAndEmptyDirs("/file_storage", logFile)
}
