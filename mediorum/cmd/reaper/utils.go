package reaper

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
)

func quoteStrings(strings []string) []string {
	quotedStrings := make([]string, len(strings))
	for i, str := range strings {
		quotedStrings[i] = fmt.Sprintf("'%s'", str)
	}
	return quotedStrings
}

func removeEmptyStrings(strings []string) []string {
	filteredStrings := make([]string, 0)
	for _, str := range strings {
		if str != "" {
			filteredStrings = append(filteredStrings, str)
		}
	}
	return filteredStrings
}

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

	// fmt.Println("moving from:", source, destination)
	err = os.Rename(source, destination)
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
