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

// iteration:        3473
// files_in_db:      0
// files_not_in_db:  668

// NOT IN DB COUNT  : 1197997
//           ERRORS : 0
//           GB USED: 484.04

// SEGMENTS  COUNT  : 1838747
//           ERRORS : 0
//           GB USED: 426.25

// COPY320   COUNT  : 38278
//           ERRORS : 0
//           GB USED: 409.56

// IMAGE     COUNT  : 198091
//           ERRORS : 0
//           GB USED: 46.19

// METADATA  COUNT  : 199555
//           ERRORS : 0
//           GB USED: 0.35

// DIR       COUNT  : 0
//           ERRORS : 0
//           GB USED: 0.00

// -----------------------
// TOTAL     GB USED: 1366.40
// -----------------------
// real	6m 33.71s
// user	0m 23.68s
// sys	0m 32.24s
