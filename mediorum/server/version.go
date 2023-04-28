package server

import (
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

	slog.Info("MEDIORUM", "revision", vcsRevision, "built", vcsBuildTime, "wip", vcsDirty)
}
