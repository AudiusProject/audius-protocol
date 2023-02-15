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
	err = test(testClient)
	ErrPanic(err)

	// close server after test ran if it passed
	s.Close()
}
