package reaper

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
)

func generateTestFixtures(b *Batcher) error {

	var err error

	// directories := []string{"111", "222", "333", "444", "555", "666", "777", "888", "999", "000"}
	// files := []string{"Qmaaa", "Qmbbb", "Qmccc", "Qmddd", "Qmeee"}
	directories := []string{"111", "222", "333", "444"}
	files := []string{"Qmaaa", "Qmbbb", "Qmccc"}

	for _, dir := range directories {
		dirPath := filepath.Join(b.Config.WalkDir, dir)

		err := os.MkdirAll(dirPath, os.ModePerm)
		if err != nil {
			fmt.Println(err)
			return err
		}

		for _, fileName := range files {
			file, err := os.Create(filepath.Join(dirPath, fileName))
			if err != nil {
				fmt.Println(err)
				return err
			}
			defer file.Close()
		}
	}

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

	return nil
}
