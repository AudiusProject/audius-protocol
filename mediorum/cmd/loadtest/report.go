package loadtest

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mediorum/server"
	"sort"
	"sync"
	"time"
)

func (tc *TestClient) problems(wg *sync.WaitGroup, peer *server.Peer) {
	defer wg.Done()
	url := fmt.Sprintf("%s%s", peer.Host, "/mediorum/internal/blobs/problems")
	resp, err := tc.HttpClient.Get(url)
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
	var results []server.ProblemBlob
	if err := json.Unmarshal(body, &results); err != nil {
		fmt.Println("ERR Can not unmarshal JSON")
		fmt.Println(peer.Host)
		return
	}
	tc.report[peer.Host] = append(tc.report[peer.Host], len(results))
}

func (tc *TestClient) Report(wg *sync.WaitGroup) {

	retryDelay := time.Millisecond * 2000
	maxRetries := 5

	for i := 1; i < maxRetries; i++ {

		noProblems := true

		for _, peer := range tc.UpPeers {
			wg.Add(1)
			tc.problems(wg, &peer)
		}

		fmt.Printf("%60s\n", "problem blobs")

		keys := make([]string, 0, len(tc.report))
		for k := range tc.report {
			keys = append(keys, k)
		}
		sort.Sort(sort.StringSlice(keys))

		for i, k := range keys {
			value := tc.report[k]
			fmt.Printf("%3d %-50s%4d\n", i+1, k, value)

			// any problem blobs after the last run?
			if value[len(value)-1] > 0 {
				noProblems = false
			}
		}

		if noProblems {
			return
		}

		time.Sleep(retryDelay)
	}
}
