package server

import (
	"log"
	"runtime/debug"
	"time"
)

var (
	vcsRevision  string
	vcsBuildTime string
	vcsDirty     string
	bootTime     string
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

	bootTime = time.Now().UTC().Format(time.RFC3339)

	log.Printf("build: revision=%s built_at=%s dirty=%s booted=%s", vcsRevision, vcsBuildTime, vcsDirty, bootTime)
}
