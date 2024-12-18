package main

import (
	"context"
	"encoding/hex"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"

	"log"
	"net"

	"github.com/AudiusProject/audius-protocol/pkg/core"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/uptime"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/crypto/acme/autocert"
)

func main() {
	tlsEnabled := getEnvBool("ENABLE_TLS", false)
	storageEnabled := getEnvBool("ENABLE_STORAGE", false)

	var slogLevel slog.Level
	if logLevel := os.Getenv("audiusd_log_level"); logLevel != "" {
		switch logLevel {
		case "debug":
			slogLevel = slog.LevelDebug
		case "info":
			slogLevel = slog.LevelInfo
		case "warn":
			slogLevel = slog.LevelWarn
		case "error":
			slogLevel = slog.LevelError
		default:
			slogLevel = slog.LevelWarn
		}
	} else {
		slogLevel = slog.LevelInfo
	}

	logger := common.NewLogger(&slog.HandlerOptions{
		Level: slogLevel,
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	hostUrl, err := getHostUrl()
	if err != nil {
		log.Fatalf("Could not get host url: %v", err)
	}

	// make it work out of the box with no config
	delegatePrivateKey := os.Getenv("delegatePrivateKey")
	if delegatePrivateKey == "" {
		delegatePrivateKey, delegateOwnerWallet := keyGen()
		os.Setenv("delegatePrivateKey", delegatePrivateKey)
		os.Setenv("delegateOwnerWallet", delegateOwnerWallet)
		logger.Infof("Generated and set delegate key pair: %s", delegateOwnerWallet)
	}

	go func() {
		if err := startEchoProxyWithOptionalTLS(hostUrl, tlsEnabled); err != nil {
			log.Fatalf("Echo server failed: %v", err)
			cancel()
		}
	}()

	go func() {
		if err := uptime.Run(ctx, logger); err != nil {
			logger.Errorf("fatal uptime error: %v", err)
			cancel()
		}
	}()

	go func() {
		if err := core.Run(ctx, logger); err != nil {
			logger.Errorf("fatal core error: %v", err)
			cancel()
		}
	}()

	if storageEnabled {
		go func() {
			if err := mediorum.Run(ctx, logger); err != nil {
				logger.Errorf("fatal mediorum error: %v", err)
				cancel()
			}
		}()
	}

	<-sigChan
	logger.Info("Received termination signal, shutting down...")

	cancel()

	<-ctx.Done() // run forever, no crashloops
	logger.Info("Shutdown complete")
}

func startEchoProxyWithOptionalTLS(hostUrl *url.URL, enableTLS bool) error {

	httpPort := os.Getenv("AUDIUSD_HTTP_PORT")
	if httpPort == "" {
		httpPort = "80"
	}

	httpsPort := os.Getenv("AUDIUSD_HTTPS_PORT")
	if httpsPort == "" {
		httpsPort = "443"
	}

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	urlCore, err := url.Parse("http://localhost:26659")
	if err != nil {
		e.Logger.Fatal(err)
	}
	urlMediorum, err := url.Parse("http://localhost:1991")
	if err != nil {
		e.Logger.Fatal(err)
	}
	urlDAPI, err := url.Parse("http://localhost:1996")
	if err != nil {
		e.Logger.Fatal(err)
	}

	coreProxy := httputil.NewSingleHostReverseProxy(urlCore)
	mediorumProxy := httputil.NewSingleHostReverseProxy(urlMediorum)
	dAPIProxy := httputil.NewSingleHostReverseProxy(urlDAPI)

	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status": "ok",
		})
	})

	e.Any("/console/*", echo.WrapHandler(coreProxy))
	e.Any("/core/*", echo.WrapHandler(coreProxy))
	e.Any("/d_api/*", echo.WrapHandler(dAPIProxy))

	e.Any("/*", echo.WrapHandler(mediorumProxy))

	shouldHaveAutoTLS := []string{
		"audius.co",
		"stuffisup.com",
		"theblueprint.xyz",
		"tikilabs.com",
		"shakespearetech.com",
		"jollyworld.xyz",
		"figment.io",
		"cultur3stake.com",
		"audiusindex.org",
	}

	domain := extractDomain(os.Getenv("creatorNodeEndpoint"))
	if domain == "" {
		domain = extractDomain(os.Getenv("audius_discprov_url"))
	}
	enableTls := isTldAllowed(domain, shouldHaveAutoTLS) || os.Getenv("ENABLE_TLS") == "true"

	if enableTls {
		// Get server's IP addresses
		addrs, err := net.InterfaceAddrs()
		if err != nil {
			e.Logger.Warn("Failed to get interface addresses:", err)
		}

		// Build whitelist starting with hostname and localhost
		whitelist := []string{hostUrl.Hostname(), "localhost"}

		// Add all non-loopback IPv4 addresses
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ip4 := ipnet.IP.To4(); ip4 != nil {
					whitelist = append(whitelist, ip4.String())
				}
			}
		}

		e.Logger.Info("TLS host whitelist:", whitelist)
		e.AutoTLSManager.HostPolicy = autocert.HostWhitelist(whitelist...)
		e.AutoTLSManager.Cache = autocert.DirCache(getEnvString("audius_core_root_dir", "/audius-core") + "/echo/cache")
		e.Pre(middleware.HTTPSRedirect())

		go func() {
			if err := e.StartAutoTLS(":" + httpsPort); err != nil && err != http.ErrServerClosed {
				e.Logger.Error("HTTPS server failed")
			}
		}()

		go func() {
			if err := e.Start(":" + httpPort); err != nil && err != http.ErrServerClosed {
				e.Logger.Fatal("HTTP server failed")
			}
		}()

		return nil
	}

	return e.Start(":" + httpPort)
}

func extractDomain(fqdn string) string {
	// Remove the scheme (e.g., "https://")
	if strings.Contains(fqdn, "://") {
		fqdn = strings.Split(fqdn, "://")[1]
	}

	// Remove the path (anything after '/')
	if strings.Contains(fqdn, "/") {
		fqdn = strings.Split(fqdn, "/")[0]
	}

	return fqdn
}

// isTldAllowed checks if the domain ends with any of the allowed TLDs
func isTldAllowed(domain string, allowedTlds []string) bool {
	for _, tld := range allowedTlds {
		if strings.HasSuffix(domain, tld) {
			return true
		}
	}
	return false
}

func getEnv[T any](key string, defaultVal T, parse func(string) (T, error)) T {
	val, ok := os.LookupEnv(key)
	if !ok {
		return defaultVal
	}
	parsed, err := parse(val)
	if err != nil {
		log.Printf("Invalid value for %s: %v, defaulting to %v", key, val, defaultVal)
		return defaultVal
	}
	return parsed
}

func getEnvString(key, defaultVal string) string {
	return getEnv(key, defaultVal, func(s string) (string, error) { return s, nil })
}

func getEnvBool(key string, defaultVal bool) bool {
	return getEnv(key, defaultVal, strconv.ParseBool)
}

func getHostUrl() (*url.URL, error) {
	ep := os.Getenv("creatorNodeEndpoint")
	if ep == "" {
		ep = os.Getenv("audiusd_discprov_url")
	}
	if ep == "" {
		ep = "localhost"
	}
	return url.Parse(ep)
}

func keyGen() (pKey string, addr string) {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		log.Fatalf("Failed to generate private key: %v", err)
	}
	privateKeyBytes := crypto.FromECDSA(privateKey)
	privateKeyStr := hex.EncodeToString(privateKeyBytes)
	address := crypto.PubkeyToAddress(privateKey.PublicKey)
	return privateKeyStr, address.Hex()
}
