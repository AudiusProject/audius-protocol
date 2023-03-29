package server

import (
	"log"
	"runtime/debug"
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

	log.Printf("MEDIORUM revision=%s built_at=%s dirty=%s", vcsRevision, vcsBuildTime, vcsDirty)
}
