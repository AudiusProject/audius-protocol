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

	endpoint := os.Getenv("creatorNodeEndpoint")
	skipEndpoints := []string{
		"https://content-node.audius.co",
		"https://creatornode.audius.co",
		"https://creatornode2.audius.co",
		"https://creatornode3.audius.co",
		"https://usermetadata.audius.co",
	}

	for _, skipEndpoint := range skipEndpoints {
		if endpoint == skipEndpoint {
			log.Printf("Skipping deletion due to matched endpoint: %s", endpoint)
			time.Sleep(10000 * time.Hour)
			return nil
		}
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
