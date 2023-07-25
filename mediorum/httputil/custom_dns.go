package httputil

import (
	"context"
	"net"
	"net/http"
	"time"
)

// configures default http client to use 1.1.1.1 for DNS resolver
// so that culturestake nodes can talk to each other
// based on: https://koraygocmen.medium.com/custom-dns-resolver-for-the-default-http-client-in-go-a1420db38a5d
func UseCustomDNS() {
	var (
		dnsResolverIP        = "1.1.1.1:53"
		dnsResolverProto     = "udp"
		dnsResolverTimeoutMs = 3000 // Timeout (ms) for the DNS resolver (optional)
	)

	dialer := &net.Dialer{
		Resolver: &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				d := net.Dialer{
					Timeout: time.Duration(dnsResolverTimeoutMs) * time.Millisecond,
				}
				return d.DialContext(ctx, dnsResolverProto, dnsResolverIP)
			},
		},
	}

	dialContext := func(ctx context.Context, network, addr string) (net.Conn, error) {
		return dialer.DialContext(ctx, network, addr)
	}

	http.DefaultTransport.(*http.Transport).DialContext = dialContext
}
