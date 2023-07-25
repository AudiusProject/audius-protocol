package reaper

import (
	"io"
	"log"
	"os"
	"path/filepath"
)

func contains(strings []string, str string) bool {
	for _, s := range strings {
		if s == str {
			return true
		}
	}
	return false
}

func moveFile(source, destination string) error {
	err := os.MkdirAll(filepath.Dir(destination), 0755)
	if err != nil {
		log.Fatal(err)
		return err
	}

	err = os.Rename(source, destination)
	if err != nil {
		log.Fatal(err)
		return err
	}

	return nil
}

func removeFile(filePath string) error {
	err := os.Remove(filePath)
	if err != nil {
		log.Fatal(err)
		return err
	}
	return nil
}

func isDirectoryEmpty(dirPath string) (bool, error) {
	dir, err := os.Open(dirPath)
	if err != nil {
		return false, err
	}
	defer dir.Close()

	_, err = dir.Readdirnames(1)
	if err == io.EOF {
		return true, nil
	}

	return false, err
}
