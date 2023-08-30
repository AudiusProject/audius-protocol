package reaper

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

func deleteFilesAndEmptyDirs(path string, logFile *os.File) error {
	log.SetOutput(logFile)

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
			log.Printf("Deleted file %s", childPath)
			time.Sleep(50 * time.Millisecond)
		}
	}

	if err := os.Remove(path); err != nil {
		log.Printf("Failed to delete directory: %s, error: %s", path, err)
		return err
	}
	log.Printf("Deleted directory %s", path)

	return nil
}

func main() {
	if err := os.MkdirAll("/cmd/logs", 0755); err != nil {
		fmt.Printf("Error creating directory: %v\n", err)
		return
	}

	logFile, err := os.OpenFile("/cmd/logs/file_storage.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		fmt.Printf("Error opening log file: %v\n", err)
		return
	}
	defer logFile.Close()

	deleteFilesAndEmptyDirs("/file_storage", logFile)
}
