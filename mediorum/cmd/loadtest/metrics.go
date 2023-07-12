package loadtest

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mediorum/server"
	"os"
	"os/exec"
	"time"
)

// !! metrics.go is WIP - will revisit !!

func RunM(tc *TestClient) {

	for {

		time.Sleep(time.Second * 2)

		cmd := exec.Command("clear")
		cmd.Stdout = os.Stdout
		cmd.Run()

		for i, peer := range tc.UpPeers {

			resp, err := tc.HttpClient.Get(fmt.Sprintf("%s/internal/metrics", peer.Host))
			if err != nil {
				fmt.Println(err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != 200 {
				fmt.Println(resp.Status)
			}

			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				fmt.Println(err)
			}

			results := server.Metrics{}
			if err := json.Unmarshal(body, &results); err != nil {
				fmt.Println("ERR Can not unmarshal JSON", err)
				return
			}

			fmt.Printf("[%3d] %+v\n", i, results)
		}

	}

}
