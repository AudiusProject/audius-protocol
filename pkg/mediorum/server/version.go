package server

import (
	"os"
	"runtime/debug"

	"golang.org/x/exp/slog"
)

var (
	vcsRevision  string
	vcsBuildTime string
	vcsDirty     string
)

func init() {
	if bi, ok := debug.ReadBuildInfo(); ok {
		for _, s := range bi.Settings {
			switch s.Key {
			case "vcs.revision":
				vcsRevision = s.Value
			case "vcs.time":
				vcsBuildTime = s.Value
			case "vcs.modified":
				vcsDirty = s.Value
			}
		}
	}

	// read GIT_SHA which is set by circleci build
	if gitSha := os.Getenv("GIT_SHA"); gitSha != "" && vcsRevision == "" {
		vcsRevision = gitSha
	}

	slog.Info("MEDIORUM", "revision", vcsRevision, "built", vcsBuildTime, "wip", vcsDirty)
}
