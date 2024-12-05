package main

import (
	"context"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/go-github/v51/github"
)

const (
	githubOwner       = "audius"
	githubRepo        = "audius-protocol"
	binaryName        = "audiusd"
	binaryDownloadDir = "/app"
	checkInterval     = time.Hour
	currentVersion    = "v1.0.0"
)

func main() {
	fmt.Println("Starting updater daemon...")

	// stagger updates across nodes
	rand.Seed(time.Now().UnixNano())
	randomMinute := rand.Intn(60)

	for {
		now := time.Now()
		nextCheck := time.Date(now.Year(), now.Month(), now.Day(), now.Hour()+1, randomMinute, 0, 0, now.Location())
		timeUntilNextCheck := time.Until(nextCheck)

		fmt.Printf("Updater: Next check scheduled for: %s\n", nextCheck.Format(time.RFC1123))
		time.Sleep(timeUntilNextCheck)

		err := checkForUpdates()
		if err != nil {
			fmt.Printf("Updater encountered an error: %v\n", err)
		}
	}
}

func checkForUpdates() error {
	client := github.NewClient(nil)
	ctx := context.Background()

	release, _, err := client.Repositories.GetLatestRelease(ctx, githubOwner, githubRepo)
	if err != nil {
		return fmt.Errorf("failed to fetch latest release: %w", err)
	}

	latestVersion := release.GetTagName()
	if latestVersion == currentVersion {
		fmt.Println("Updater: Already running the latest version.")
		return nil
	}

	fmt.Printf("Updater: New version available: %s. Downloading...\n", latestVersion)

	assetURL, err := findAssetURL(release, binaryName)
	if err != nil {
		return fmt.Errorf("failed to find release asset: %w", err)
	}

	newBinaryPath, err := downloadBinary(assetURL, latestVersion)
	if err != nil {
		return fmt.Errorf("failed to download binary: %w", err)
	}

	err = stopCurrentBinary()
	if err != nil {
		return fmt.Errorf("failed to stop current binary: %w", err)
	}

	err = startNewBinary(newBinaryPath)
	if err != nil {
		return fmt.Errorf("failed to start new binary: %w", err)
	}

	fmt.Printf("Updater: Successfully updated to version %s\n", latestVersion)
	return nil
}

func findAssetURL(release *github.RepositoryRelease, assetName string) (string, error) {
	for _, asset := range release.Assets {
		if strings.Contains(asset.GetName(), assetName) {
			return asset.GetBrowserDownloadURL(), nil
		}
	}
	return "", fmt.Errorf("asset %q not found in release", assetName)
}

func downloadBinary(url, version string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to download binary: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download binary: HTTP %d", resp.StatusCode)
	}

	binaryPath := filepath.Join(binaryDownloadDir, fmt.Sprintf("%s-%s", binaryName, version))
	out, err := os.Create(binaryPath)
	if err != nil {
		return "", fmt.Errorf("failed to create file for binary: %w", err)
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to write binary: %w", err)
	}

	err = os.Chmod(binaryPath, 0755)
	if err != nil {
		return "", fmt.Errorf("failed to make binary executable: %w", err)
	}

	return binaryPath, nil
}

func stopCurrentBinary() error {
	cmd := exec.Command("pkill", "-f", binaryName)
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("failed to stop current binary: %w", err)
	}
	fmt.Println("Updater: Stopped current binary.")
	return nil
}

func startNewBinary(path string) error {
	cmd := exec.Command(path)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Start()
	if err != nil {
		return fmt.Errorf("failed to start new binary: %w", err)
	}
	fmt.Printf("Updater: Started new binary from %s\n", path)
	return nil
}
