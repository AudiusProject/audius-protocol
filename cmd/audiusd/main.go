package main

import (
	"context"
	"encoding/hex"
	"fmt"
	"log"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"runtime/debug"
	"strings"
	"syscall"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum"
	"github.com/AudiusProject/audius-protocol/pkg/uptime"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/crypto/acme/autocert"
)

const (
	initialBackoff = 10 * time.Second
	maxBackoff     = 10 * time.Minute
	maxRetries     = 10
)

var startTime time.Time

type proxyConfig struct {
	path   string
	target string
}

type serverConfig struct {
	httpPort   string
	httpsPort  string
	hostname   string
	tlsEnabled bool
}

func main() {
	startTime = time.Now().UTC()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger := setupLogger()
	hostUrl := setupHostUrl()
	setupDelegateKeyPair(logger)

	services := []struct {
		name    string
		fn      func() error
		enabled bool
	}{
		{"audiusd-echo-server", func() error { return startEchoProxyWithOptionalTLS(hostUrl, logger) }, true},
		{"core", func() error { return core.Run(ctx, logger) }, true},
		{"mediorum", func() error { return mediorum.Run(ctx, logger) }, isStorageEnabled()},
		{"uptime", func() error { return uptime.Run(ctx, logger) }, hostUrl.Hostname() != "localhost"},
	}

	for _, svc := range services {
		if svc.enabled {
			runWithRecover(svc.name, ctx, logger, svc.fn)
		}
	}

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	logger.Info("Received termination signal, shutting down...")
	cancel()
	<-ctx.Done()
	logger.Info("Shutdown complete")
}

func runWithRecover(name string, ctx context.Context, logger *common.Logger, f func() error) {
	backoff := initialBackoff
	retries := 0

	var run func()
	run = func() {
		defer func() {
			if r := recover(); r != nil {
				logger.Errorf("%s goroutine panicked: %v", name, r)
				logger.Errorf("%s stack trace: %s", name, string(debug.Stack()))

				select {
				case <-ctx.Done():
					logger.Infof("%s shutdown requested, not restarting", name)
					return
				default:
					if retries >= maxRetries {
						logger.Errorf("%s exceeded maximum retry attempts (%d). Not restarting.", name, maxRetries)
						return
					}

					retries++
					logger.Infof("%s will restart in %v (attempt %d/%d)", name, backoff, retries, maxRetries)
					time.Sleep(backoff)

					// Exponential backoff
					backoff = time.Duration(float64(backoff) * 2)
					if backoff > maxBackoff {
						backoff = maxBackoff
					}

					// Restart the goroutine
					go run()
				}
			}
		}()

		if err := f(); err != nil {
			logger.Errorf("%s error: %v", name, err)
			// Treat errors like panics and restart the service
			panic(fmt.Sprintf("%s error: %v", name, err))
		}
	}

	go run()
}

func setupLogger() *common.Logger {
	var slogLevel slog.Level
	switch os.Getenv("audiusd_log_level") {
	case "debug":
		slogLevel = slog.LevelDebug
	case "info":
		slogLevel = slog.LevelInfo
	case "warn":
		slogLevel = slog.LevelWarn
	case "error":
		slogLevel = slog.LevelError
	default:
		slogLevel = slog.LevelInfo
	}

	return common.NewLogger(&slog.HandlerOptions{Level: slogLevel})
}

func setupHostUrl() *url.URL {
	endpoints := []string{
		os.Getenv("creatorNodeEndpoint"),
		os.Getenv("audius_discprov_url"),
	}

	for _, ep := range endpoints {
		if ep != "" {
			if u, err := url.Parse(ep); err == nil {
				return u
			}
		}
	}
	return &url.URL{Scheme: "http", Host: "localhost"}
}

func setupDelegateKeyPair(logger *common.Logger) {
	if delegatePrivateKey := os.Getenv("delegatePrivateKey"); delegatePrivateKey == "" {
		privKey, ownerWallet := keyGen()
		os.Setenv("delegatePrivateKey", privKey)
		os.Setenv("delegateOwnerWallet", ownerWallet)
		logger.Infof("Generated and set delegate key pair: %s", ownerWallet)
	}
}

func getEchoServerConfig(hostUrl *url.URL) serverConfig {
	httpPort := getEnvString("AUDIUSD_HTTP_PORT", "80")
	httpsPort := getEnvString("AUDIUSD_HTTPS_PORT", "443")
	hostname := hostUrl.Hostname()

	// TODO: Work out of the box for altego.net, but allow override
	if hostname == "altego.net" && httpPort == "80" && httpsPort == "443" {
		httpPort = "5000"
	}

	tlsEnabled := true
	switch {
	case os.Getenv("AUDIUSD_TLS_DISABLED") == "true":
		tlsEnabled = false
	case hasSuffix(hostname, []string{"localhost", "altego.net", "bdnodes.net", "staked.cloud"}):
		tlsEnabled = false
	}

	return serverConfig{
		httpPort:   httpPort,
		httpsPort:  httpsPort,
		hostname:   hostname,
		tlsEnabled: tlsEnabled,
	}
}

func startEchoProxyWithOptionalTLS(hostUrl *url.URL, logger *common.Logger) error {
	e := echo.New()
	e.Use(middleware.Logger(), middleware.Recover())

	// healthCheckResponse returns the standard health check response data
	healthCheckResponse := func() map[string]interface{} {
		return map[string]interface{}{
			"status":    "ok",
			"git":       os.Getenv("GIT_SHA"),
			"hostname":  hostUrl.Hostname(),
			"uptime":    time.Since(startTime).String(),
			"timestamp": time.Now().UTC(),
		}
	}

	// Minimal health check endpoint
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, healthCheckResponse())
	})

	// TODO: Proxy health check endpoint for core only discovery nodes
	if os.Getenv("audius_discprov_url") != "" {
		e.GET("/health_check", func(c echo.Context) error {
			return c.JSON(http.StatusOK, healthCheckResponse())
		})
	}

	// Reverse proxies to what were previously discreet containers
	proxies := []proxyConfig{
		{"/console/*", "http://localhost:26659"},
		{"/core/*", "http://localhost:26659"},
	}

	if hostUrl.Hostname() != "localhost" {
		proxies = append(proxies, proxyConfig{"/d_api/*", "http://localhost:1996"})
	}

	if isStorageEnabled() {
		proxies = append(proxies, proxyConfig{"/*", "http://localhost:1991"})
	}

	for _, proxy := range proxies {
		target, err := url.Parse(proxy.target)
		if err != nil {
			logger.Error("Failed to parse URL:", err)
			continue
		}
		e.Any(proxy.path, echo.WrapHandler(httputil.NewSingleHostReverseProxy(target)))
	}

	config := getEchoServerConfig(hostUrl)

	if config.tlsEnabled {
		return startWithTLS(e, config.httpPort, config.httpsPort, hostUrl, logger)
	}
	return e.Start(":" + config.httpPort)
}

func startWithTLS(e *echo.Echo, httpPort, httpsPort string, hostUrl *url.URL, logger *common.Logger) error {
	whitelist := []string{hostUrl.Hostname(), "localhost"}
	addrs, _ := net.InterfaceAddrs()
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ip4 := ipnet.IP.To4(); ip4 != nil {
				whitelist = append(whitelist, ip4.String())
			}
		}
	}

	logger.Info("TLS host whitelist: " + strings.Join(whitelist, ", "))
	e.AutoTLSManager.HostPolicy = autocert.HostWhitelist(whitelist...)
	e.AutoTLSManager.Cache = autocert.DirCache(getEnvString("audius_core_root_dir", "/audius-core") + "/echo/cache")
	e.Pre(middleware.HTTPSRedirect())

	go e.StartAutoTLS(":" + httpsPort)
	return e.Start(":" + httpPort)
}

func isStorageEnabled() bool {
	if os.Getenv("AUDIUSD_STORAGE_ENABLED") == "false" {
		return false
	}
	return os.Getenv("creatorNodeEndpoint") != "" || os.Getenv("AUDIUSD_STORAGE_ENABLED") == "true"
}

func keyGen() (string, string) {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		log.Fatalf("Failed to generate private key: %v", err)
	}
	privateKeyBytes := crypto.FromECDSA(privateKey)
	return hex.EncodeToString(privateKeyBytes), crypto.PubkeyToAddress(privateKey.PublicKey).Hex()
}

func getEnvString(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func hasSuffix(domain string, suffixes []string) bool {
	for _, suffix := range suffixes {
		if strings.HasSuffix(domain, suffix) {
			return true
		}
	}
	return false
}
