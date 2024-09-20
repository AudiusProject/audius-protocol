package config

import "os"

var GitHash string = os.Getenv("GIT_SHA")
