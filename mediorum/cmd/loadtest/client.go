package loadtest

import (
	"fmt"
	"mediorum/server"
	"net/http"
	"os"
	"sync"
	"time"
)

type TestClient struct {
	AllPeers   []server.Peer
	UpPeers    []server.Peer
	DownPeers  []server.Peer
	HttpClient *http.Client
	report     map[string][]int
}

func NewTestClient(allPeers []server.Peer) *TestClient {

	tc := TestClient{
		AllPeers:   allPeers,
		UpPeers:    make([]server.Peer, 0),
		DownPeers:  make([]server.Peer, 0),
		HttpClient: &http.Client{},
		report:     make(map[string][]int),
	}

	fmt.Println("_____________\nPinging Peers")
	wg := sync.WaitGroup{}
	for _, peer := range allPeers {
		wg.Add(1)
		go tc.pingPeer(&wg, peer)
	}
	wg.Wait()
	fmt.Printf("\n")

	fmt.Printf("[%d/%d] peers available\n", len(tc.UpPeers), len(tc.AllPeers))

	if len(tc.UpPeers) == 0 {
		fmt.Println("ERR Cannot continue without at least one peer")
		os.Exit(1)
	}

	return &tc
}

func (tc *TestClient) pingPeer(wg *sync.WaitGroup, peer server.Peer) {
	defer wg.Done()

	client := &http.Client{Timeout: 1000 * time.Millisecond} // fail fast for heath check
	req, err := http.NewRequest("GET", fmt.Sprintf("%s%s", peer.Host, "/health_check"), nil)
	if err != nil {
		fmt.Printf("e")
		return
	}
	req.Header.Set("User-Agent", "mediorum-load-test")
	res, err := client.Do(req)
	if err != nil {
		fmt.Printf("e")
		return
	}

	if res.StatusCode == http.StatusOK {
		fmt.Printf(".")
		tc.UpPeers = append(tc.UpPeers, peer)
	} else {
		fmt.Printf("x")
		tc.DownPeers = append(tc.DownPeers, peer)
	}
}
