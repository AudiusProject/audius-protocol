package testutils

import (
	"time"

	"comms.audius.co/trending/config"
	"comms.audius.co/trending/trendingserver"
	"github.com/imroc/req/v3"
)

func ErrPanic(e error) {
	if e != nil {
		panic(e)
	}
}

// Intakes a func that's inside a test runner.
// Will run the trending server with the test default config
// and shut it down if the timeout occurs or the test passes.
//
// WARNING: panicking in the test itself will not be caught by
// this runner and may not shut down the server correctly
func IntegrationTester(test func(c *req.Client) error) {
	conf, err := config.TestDefault()
	ErrPanic(err)

	s, err := trendingserver.NewTrendingServer(*conf)
	ErrPanic(err)

	// start server in separate go routine
	go s.Run()
	go func() {
		// timeout server in 10 seconds
		// can extend this if tests require longer
		time.Sleep(10 * time.Second)
		s.Close()
		panic("test took too long")
	}()

	// run test on main thread
	// provides test echo context to avoid duplicating test code
	testClient := req.C()
	testClient.SetBaseURL("http://localhost" + conf.FormatEchoPort())
	err = test(testClient)
	ErrPanic(err)

	// close server after test ran if it passed
	s.Close()
}
