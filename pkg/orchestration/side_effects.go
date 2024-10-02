package orchestration

import (
	"fmt"
	"net/http"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
)

func awaitHealthy(nodes map[string]conf.NodeConfig) {
	for host := range nodes {
		awaitChan := make(chan string)
		go awaitService(host, awaitChan)
		for log := range awaitChan {
			logger.Info(log)
		}
	}
}

func awaitService(host string, awaitChan chan string) {
	defer close(awaitChan)
	tries := 30

	for tries > 0 {

		client := &http.Client{
			Timeout: time.Second * 3,
		}

		url := fmt.Sprintf("https://%s/health_check", host)
		resp, err := client.Get(url)

		if err != nil || resp.StatusCode != http.StatusOK {
			awaitChan <- fmt.Sprintf("service: %s not ready yet...", url)
			time.Sleep(3 * time.Second)
			tries--
			continue
		}

		awaitChan <- fmt.Sprintf("%s is healthy! 🎸", host)
		if resp != nil {
			resp.Body.Close()
		}
		return
	}

	awaitChan <- fmt.Sprintf("%s never got healthy", host)
}
