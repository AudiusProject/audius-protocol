// Package storageserver lives for the lifetime of the program and mananges connections and route handlers.
package storageserver

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"testing"
	"time"

	"comms.audius.co/storage/transcode"
	"github.com/labstack/echo/v4"
	"github.com/nats-io/nats-server/v2/server"
	natsserver "github.com/nats-io/nats-server/v2/test"
	"github.com/nats-io/nats.go"
	"github.com/stretchr/testify/assert"
)

// TODO: Can probably move cluster creation to TestMain and for the test just connect directly to localhost:1222 (and reset state at beginning of test)

// TestE2EUpload verifies that a file gets uploaded to the storage node, transcoded, and permanently stored and replicated on the correct nodes.
func TestE2EUpload(t *testing.T) {
	assert := assert.New(t)

	// Start 5 storage nodes (NATS cluster and web servers)
	nodes := startNatsCluster(t)
	defer func() {
		for _, node := range nodes {
			shutdownJSServerAndRemoveStorage(t, node.s)
		}
	}()

	// TODO: Upload file with a hash that will fall in the 'aa' bucket
	jobman, err := transcode.NewJobsManager(nodes[0].ss.Jsc, nodes[0].ss.Namespace, 1)
	if err != nil {
		panic(err)
	}
	jobman.StartWorkers(3)

	url := "/storage/file"
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("object", "test.mp3") // TODO: This could be a randomly generated file
	assert.NoError(err)
	sample, err := os.Open("test.mp3") // TODO: This could be a randomly generated file
	assert.NoError(err)

	_, err = io.Copy(part, sample)
	assert.NoError(err)
	assert.NoError(writer.Close())

	req, err := http.NewRequest(http.MethodPost, url, body)
	assert.NoError(err)
	req.Header.Set(echo.HeaderContentType, writer.FormDataContentType())
	templateWriter, err := writer.CreateFormField("template")
	assert.NoError(err)
	templateWriter.Write([]byte(transcode.JobTemplateAudio))

	rec := httptest.NewRecorder()
	ss := nodes[0].ss
	c := ss.WebServer.NewContext(req, rec)
	res := rec.Result()
	defer res.Body.Close()
	if assert.NoError(ss.serveFileUpload(c)) {
		assert.Equal(http.StatusOK, rec.Code)
		assert.Equal("null\n", rec.Body.String()) // TODO: This passes now but shouldn't be "null\n"
	}

	// TODO: Verify that file is stored in the 'aa' bucket on exactly 3 of the 5 nodes

	// TODO: Verify that all other buckets are empty
}

type testServer struct {
	s  *server.Server
	ss *StorageServer
}

func startNatsCluster(t *testing.T) [5]*testServer {
	nodes := [5]*testServer{}
	wg := sync.WaitGroup{}
	for i := 1; i <= 5; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			// Start NATS server (every node except first one has a route to the first node)
			var s *server.Server
			if i == 1 {
				s = runBasicJetStreamServer(1222, 1248, 1249)
			} else {
				s = runBasicJetStreamServer(1222+i-1, 1248+i-1, 1248)
			}

			nodes[i-1] = &testServer{s: s}
		}(i)
	}
	wg.Wait()

	// Wait until nodes (4 others, 5 total in the cluster) are connected
	numRoutes := 0
	clusterSize := 0
	for numRoutes != 4 || clusterSize != 5 {
		time.Sleep(1000 * time.Millisecond)
		routez, err := nodes[0].s.Routez(&server.RoutezOptions{})
		if err != nil {
			t.Fatalf("Could not get routez info: %v", err)
		}
		jsInfo, err := nodes[0].s.Jsz(&server.JSzOptions{})
		if err != nil {
			t.Fatalf("Could not get jsz info: %v", err)
		}
		numRoutes = routez.NumRoutes
		clusterSize = jsInfo.Meta.Size
	}

	// The above wait should've been sufficient but better to have the test be long than flaky
	time.Sleep(2000 * time.Millisecond)

	// Start each node's web server
	for i, node := range nodes {
		_, jsc := jsClient(t, node.s)
		ss := NewProd(jsc)
		go ss.WebServer.Start(fmt.Sprintf("127.0.0.1:%d", 1222+i+5))
		nodes[i].ss = ss
	}

	return nodes
}

func runBasicJetStreamServer(clientPort int, clusterPort int, seedPort int) *server.Server {
	opts := natsserver.DefaultTestOptions
	opts.ServerName = fmt.Sprintf("server-%d-%d", clientPort, clusterPort)
	opts.Host = "127.0.0.1"
	opts.Port = clientPort
	opts.StoreDir = fmt.Sprintf("/tmp/test-server_%d", clusterPort)
	opts.JetStream = true
	opts.NoLog = false
	opts.Debug = true
	opts.Trace = false
	opts.WriteDeadline = 10 * time.Second
	opts.MaxPayload = int32(4096 * 1024)
	opts.JetStreamMaxMemory = int64(4096 * 1024)

	opts.Cluster = server.ClusterOpts{
		Name: "test-cluster",
		Host: "127.0.0.1",
		Port: clusterPort,
	}
	opts.Routes = server.RoutesFromStr(fmt.Sprintf("nats://localhost:%d", seedPort))

	return runServer(&opts)
}

func client(t *testing.T, s *server.Server, opts ...nats.Option) *nats.Conn {
	t.Helper()
	nc, err := nats.Connect(s.ClientURL(), opts...)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	return nc
}

func jsClient(t *testing.T, s *server.Server, opts ...nats.Option) (*nats.Conn, nats.JetStreamContext) {
	t.Helper()
	nc := client(t, s, opts...)
	js, err := nc.JetStream(nats.MaxWait(10 * time.Second))
	if err != nil {
		t.Fatalf("Unexpected error getting JetStream context: %v", err)
	}
	return nc, js
}

func shutdownJSServerAndRemoveStorage(t *testing.T, s *server.Server) {
	t.Helper()
	var sd string
	if config := s.JetStreamConfig(); config != nil {
		sd = config.StoreDir
	}
	s.Shutdown()
	// if sd != _EMPTY_ {
	if err := os.RemoveAll(sd); err != nil {
		t.Fatalf("Unable to remove storage %q: %v", sd, err)
	}
	// }
	s.WaitForShutdown()
}

// runServer starts a new Go routine based server.
func runServer(opts *server.Options) *server.Server {
	s, err := server.NewServer(opts)
	if err != nil || s == nil {
		panic(fmt.Sprintf("No NATS Server object returned: %v", err))
	}

	if !opts.NoLog {
		s.ConfigureLogger()
	}

	// Run server in Go routine.
	go s.Start()

	// Wait for accept loop(s) to be started
	if !s.ReadyForConnections(10 * time.Second) {
		panic("Unable to start NATS Server in Go Routine")
	}
	return s
}
