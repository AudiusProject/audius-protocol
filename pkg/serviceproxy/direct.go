package serviceproxy

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jaswdr/faker"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
)

// a service proxy that calls services directly without going through
// another registered node
type DirectProxy struct {
	// if empty string, returns stub data
	ipDataApiKey string
	useMockData  bool
	logger       *common.Logger
}

func NewDirectProxy(logger *common.Logger, apiKey string, useMockData bool) *DirectProxy {
	return &DirectProxy{
		logger:       logger.Child("service_proxy"),
		useMockData:  useMockData,
		ipDataApiKey: apiKey,
	}
}

func (dp *DirectProxy) GetIPData(ip string) (*LocationData, error) {
	logger := dp.logger

	if dp.useMockData {
		f := faker.New()

		city := f.Address().City()
		region := f.Address().State()
		country := f.Address().Country()
		return &LocationData{
			City:    city,
			Region:  region,
			Country: country,
		}, nil
	}

	url := fmt.Sprintf("https://api.ipdata.co/%s?api-key=%s", ip, dp.ipDataApiKey)
	resp, err := http.Get(url)
	if err != nil {
		logger.Error("Error requesting IP data:", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Error("Non-200 response from IP data service:", resp.Status)
		return nil, fmt.Errorf("non-200 response: %s", resp.Status)
	}

	var data struct {
		City        string `json:"city"`
		Region      string `json:"region"`
		CountryName string `json:"country_name"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		logger.Error("Error decoding IP data response:", err)
		return nil, err
	}

	location := &LocationData{
		City:    data.City,
		Region:  data.Region,
		Country: data.CountryName,
	}

	return location, nil
}

var _ ServiceProxy = (*DirectProxy)(nil)
