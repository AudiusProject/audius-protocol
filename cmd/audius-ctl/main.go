package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"regexp"
	"strings"
	"syscall"

	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/google/go-github/v61/github"
	"github.com/spf13/cobra"
)

var (
	Version              string
	displayVersion       bool
	debugLogging         bool
	audiusctlSemverRegex = regexp.MustCompile(`\d+\.\d+\.\d+`)
)

func main() {
	msgCh := make(chan string)
	go checkNewVersion(msgCh)

	var rootCmd = &cobra.Command{
		Use:   "audius-ctl [command]",
		Short: "CLI for provisioning and interacting with audius nodes",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			if debugLogging {
				logger.SetCliLogLevel(slog.LevelDebug)
			}
		},
		Run: func(cmd *cobra.Command, args []string) {
			if displayVersion {
				fmt.Println(Version)
				return
			}
			cmd.Help()
		},
	}

	rootCmd.Flags().BoolVarP(&displayVersion, "version", "v", false, "Display version info")
	rootCmd.PersistentFlags().BoolVar(&debugLogging, "debug", false, "Print debug logs in console")
	rootCmd.AddCommand(configCmd, devnetCmd, downCmd, jumpCmd, registerCmd, restartCmd, sbCmd, statusCmd, upCmd)
	registerCmd.Hidden = true // Hidden as the command is currently only for local devnet registration

	// Handle interrupt/sigterm to mention logfile
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		fmt.Fprintf(os.Stderr, "\nInterrupted\n")
		fmt.Fprintf(os.Stderr, "View full debug logs at %s\n", logger.GetLogFilepath())
		os.Exit(1)
	}()

	err := rootCmd.Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "View full debug logs at %s\n", logger.GetLogFilepath())
	}

	vmsg := <-msgCh
	if vmsg != "" {
		fmt.Fprintf(os.Stderr, vmsg)
	}

	if err != nil {
		os.Exit(1)
	}
}

func checkNewVersion(msg chan string) {
	// Skip new version check for development builds
	if !audiusctlSemverRegex.MatchString(Version) {
		logger.Debug("Skipping check for new audius-ctl versions.")
		msg <- ""
		return
	}

	// Fetch the latest release information from GitHub API
	ghClient := github.NewClient(nil)
	releases, resp, err := ghClient.Repositories.ListReleases(
		context.Background(),
		"AudiusProject",
		"audius-protocol",
		&github.ListOptions{
			Page:    1,
			PerPage: 30,
		},
	)
	if err != nil {
		logger.Debugf("Failed to check for new versions of audius-ctl: %s", err.Error())
		msg <- ""
		return
	}
	defer resp.Body.Close()
	if !strings.HasPrefix(resp.Status, "2") {
		logger.Debugf("Failed to check for new versions of audius-ctl: got code %s", resp.Status)
		msg <- ""
		return
	}

	var latestVersion string
	for _, release := range releases {
		if release.TagName == nil {
			logger.Debug("Failed to check for new versions of audius-ctl: Null tag for latest release")
			msg <- ""
			return
		}
		splitTag := strings.Split(*release.TagName, "@")
		if splitTag[0] != "audius-ctl" {
			continue
		} else {
			latestVersion = splitTag[len(splitTag)-1]
			break
		}
	}
	if latestVersion != "" && latestVersion != Version {
		logger.Debugf("Found new version of audius-ctl: %s (current: %s)", latestVersion, Version)
		msg <- fmt.Sprintf("\nNew version of audius-ctl available: %s (you have %s)\nRun `curl -sSL https://install.audius.org | sh` to install.\n", latestVersion, Version)
	} else {
		logger.Debug("Current version of audius-ctl is up-to-date.")
		msg <- ""
	}
}
