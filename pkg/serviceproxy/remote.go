package serviceproxy

import (
	"crypto/ecdsa"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"net/http"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
)

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

func NewRemoteProxy(logger *common.Logger, privKey *ecdsa.PrivateKey, clientBaseUrls []string, retriesPerClient int) *RemoteProxy {
	return &RemoteProxy{
		logger:           logger,
		self:             privKey,
		clientUrls:       clientBaseUrls,
		retriesPerClient: retriesPerClient,
	}
}

func (rp *RemoteProxy) GetIPData(ip string) (*LocationData, error) {
	attempts := 0
	for {
		// shuffle urls so first one configured doesn't always get picked first
		clientUrls := append([]string(nil), rp.clientUrls...)
		rand.Shuffle(len(clientUrls), func(i, j int) {
			clientUrls[i], clientUrls[j] = clientUrls[j], clientUrls[i]
		})

		// iterate through all clients
		// in case of error, continue loop to next client
		// if all error, increase attempt count
		// else return the response from the first client
		for _, client := range clientUrls {
			res, err := rp.GetIPDataFromClient(client, ip)
			if err != nil {
				logger.Errorf("error getting ip proxy data: %v", err)
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

func (rp *RemoteProxy) GetIPDataFromClient(url, ip string) (*LocationData, error) {
	logger := rp.logger
	resp, err := http.Get(fmt.Sprintf("%s/ip/%s", url, ip))
	if err != nil {
		logger.Error("Error requesting IP proxy data:", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Error("Non-200 response from IP proxy service:", resp.Status)
		return nil, fmt.Errorf("non-200 response: %s", resp.Status)
	}

	var data struct {
		City        string `json:"city"`
		Region      string `json:"region"`
		CountryName string `json:"country_name"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		logger.Error("Error decoding IP proxy response:", err)
		return nil, err
	}

	location := &LocationData{
		City:    data.City,
		Region:  data.Region,
		Country: data.CountryName,
	}

	return location, nil
}

var _ ServiceProxy = (*RemoteProxy)(nil)
