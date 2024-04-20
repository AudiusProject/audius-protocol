package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
)

func sync(source, destination, profile string) error {
	cmdArgs := []string{"s3", "sync", source, destination}
	if profile != "" {
		cmdArgs = append(cmdArgs, "--profile", profile)
	}
	cmd := exec.Command("aws", cmdArgs...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func bucketExists(bucketName, profile string) bool {
	cmd := exec.Command("aws", "s3", "ls", "s3://"+bucketName, "--profile", profile)
	if err := cmd.Run(); err != nil {
		return false
	}
	return true
}

func createBucket(bucketName, profile string) error {
	cmd := exec.Command("aws", "s3", "mb", "s3://"+bucketName, "--profile", profile)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func main() {
	args := os.Args[1:]
	if len(args) != 1 {
		log.Fatal("Usage: sync s3://bucket/folder")
	}
	bucketPath := args[0]
	if !strings.HasPrefix(bucketPath, "s3://") {
		log.Fatal("Invalid S3 path. Make sure it starts with s3://")
	}
	bucketName := strings.Split(strings.TrimPrefix(bucketPath, "s3://"), "/")[0]

	// Create a temporary directory in the current directory
	tmpDir, err := os.MkdirTemp(".", "tmp")
	if err != nil {
		log.Fatalf("Failed to create temporary directory: %v", err)
	}
	fmt.Printf("Temporary directory created at: %s\n", tmpDir)

	// Ensure the temporary directory is removed after use
	defer os.RemoveAll(tmpDir)

	// Sync from S3 bucket to temp location
	fmt.Println("Syncing from S3 bucket to tmp...")
	err = sync(bucketPath, tmpDir, "")
	if err != nil {
		log.Fatalf("Error syncing from S3 to local: %v", err)
	}

	// Check if the S3 bucket exists and create it if it does not
	if !bucketExists(bucketName, "local") {
		fmt.Println("Bucket does not exist, creating bucket:", bucketName)
		if err := createBucket(bucketName, "local"); err != nil {
			log.Fatalf("Failed to create bucket: %v", err)
		}
	}

	// Sync from temp location to local S3 bucket using local profile
	fmt.Println("Syncing from tmp to local S3 bucket...")
	err = sync(tmpDir, bucketPath, "local")
	if err != nil {
		log.Fatalf("Error syncing from tmp to local S3: %v", err)
	}

	fmt.Println("Sync done!")
	fmt.Printf("Try aws s3 ls %s\n", bucketPath)
}
