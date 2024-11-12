package serviceproxy

import (
	"crypto/ecdsa"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"net/http"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
)

// a service proxy that sends requests through another registered node
type RemoteProxy struct {
	// priv key to sign requests with
	self *ecdsa.PrivateKey
	// http clients of proxys
	clientUrls []string
	// how many times to retry getting an ip
	// total retries = clients * retriesPerClient
	retriesPerClient int

	logger *common.Logger
}

func NewRemoteProxy(logger *common.Logger, privKey *ecdsa.PrivateKey, clientIpUrls []string, retriesPerClient int) *RemoteProxy {
	return &RemoteProxy{
		logger:           logger.Child("service_proxy"),
		self:             privKey,
		clientUrls:       clientIpUrls,
		retriesPerClient: retriesPerClient,
	}
}

func (rp *RemoteProxy) GetIPData(ip string) (*LocationData, error) {
	attempts := 0
	for {
		// shuffle urls so first one configured doesn't always get picked first
		clientIpUrls := append([]string(nil), rp.clientUrls...)
		rand.Shuffle(len(clientIpUrls), func(i, j int) {
			clientIpUrls[i], clientIpUrls[j] = clientIpUrls[j], clientIpUrls[i]
		})

		// iterate through all clients
		// in case of error, continue loop to next client
		// if all error, increase attempt count
		// else return the response from the first client
		for _, clientIPUrl := range clientIpUrls {
			res, shouldRetry, err := rp.GetIPDataFromClient(clientIPUrl, ip)
			// bad requests or unauthorized, don't retry
			if !shouldRetry && err != nil {
				return nil, err
			}

			if err != nil {
				logger.Errorf("error getting ip proxy data: %v", err)
				time.Sleep(3 * time.Second)
				continue
			}
			return res, nil
		}

		attempts += 1

		if attempts > rp.retriesPerClient {
			break
		}
	}
	return nil, errors.New("exhausted ip proxy requests")
}

// calls GET url/{ip}, bool is a shouldRetry param
func (rp *RemoteProxy) GetIPDataFromClient(url, ip string) (*LocationData, bool, error) {
	logger := rp.logger

	// Create the request with the specified IP endpoint
	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/%s", url, ip), nil)
	if err != nil {
		logger.Error("Error creating request for IP proxy data:", err)
		return nil, true, err
	}

	// Use the current Unix time for signing
	reqTime := time.Now().Unix()

	// Sign the request using the provided private key, IP, and timestamp
	err = signProxyRequest(rp.self, req, ip, reqTime)
	if err != nil {
		logger.Error("Error signing proxy request:", err)
		return nil, true, err
	}

	// Execute the signed request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		logger.Error("Error requesting IP proxy data:", err)
		return nil, true, err
	}
	defer resp.Body.Close()

	// Check for non-200 response codes
	if resp.StatusCode != http.StatusOK {
		logger.Error("Non-200 response from IP proxy service:", "status", resp.Status)
		shouldRetry := true
		// don't retry on bad requests or unauth errors
		if resp.StatusCode >= 400 && resp.StatusCode < 500 {
			shouldRetry = false
		}
		return nil, shouldRetry, fmt.Errorf("non-200 response: %s", resp.Status)
	}

	// Decode the response body into the expected structure
	var data struct {
		City        string `json:"city"`
		Region      string `json:"region"`
		CountryName string `json:"country_name"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		logger.Error("Error decoding IP proxy response:", "error", err)
		return nil, false, err
	}

	// Map the response to LocationData
	location := &LocationData{
		City:    data.City,
		Region:  data.Region,
		Country: data.CountryName,
	}

	return location, false, nil
}

var _ ServiceProxy = (*RemoteProxy)(nil)
