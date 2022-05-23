// https://github.com/gliderlabs/logspout/blob/818dd8260e52d2c148280d86170bdf5267b5c637/modules.go

package main

import (
	_ "github.com/gliderlabs/logspout/adapters/multiline"
	_ "github.com/gliderlabs/logspout/adapters/raw"
	_ "github.com/gliderlabs/logspout/adapters/syslog"
	_ "github.com/gliderlabs/logspout/healthcheck"
	_ "github.com/gliderlabs/logspout/httpstream"
	_ "github.com/gliderlabs/logspout/routesapi"
	_ "github.com/gliderlabs/logspout/transports/tcp"
	_ "github.com/gliderlabs/logspout/transports/tls"
	_ "github.com/gliderlabs/logspout/transports/udp"
)
