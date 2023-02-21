package trendingserver_test

import (
	"io"

	. "comms.audius.co/trending/codegen"
	"comms.audius.co/trending/config"
	"comms.audius.co/trending/trendingserver"
	"github.com/imroc/req/v3"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Trendingserver Suite", Ordered, func() {
	// define test level constants
	var conf *config.Config
	var server *trendingserver.TrendingServer
	var client *req.Client

	// set test level constants
	BeforeAll(func() {
		c, err := config.TestDefault()
		Expect(err).NotTo(HaveOccurred())
		conf = c

		s, err := trendingserver.NewTrendingServer(*conf)
		Expect(err).NotTo(HaveOccurred())
		server = s
		// run server in separate goroutine
		go server.Run()

		tc := req.C()
		tc.SetBaseURL("http://localhost" + conf.FormatEchoPort())
		client = tc
	})

	It("can call the trending health check", func() {
		resp, err := client.R().Get("/trending/health")
		Expect(err).NotTo(HaveOccurred())

		Expect(resp.StatusCode).To(Equal(200))

		b, err := io.ReadAll(resp.Body)
		Expect(err).NotTo(HaveOccurred())

		Expect(string(b)).To(Equal("healthy :)"))
	})

	It("can call the trending tracks endpoint", func() {
		resp, err := client.R().Get("/tracks/trending")
		Expect(err).NotTo(HaveOccurred())

		Expect(resp.StatusCode).To(Equal(200))
		var res TracksResponse
		err = resp.UnmarshalJson(&res)

		// just check it validated types for now
		Expect(err).NotTo(HaveOccurred())
	})

	It("can call the trending playlists endpoint", func() {
		resp, err := client.R().Get("/playlists/trending")
		Expect(err).NotTo(HaveOccurred())

		Expect(resp.StatusCode).To(Equal(200))
		var res TrendingPlaylistsResponse
		err = resp.UnmarshalJson(&res)

		// just check it validated types for now
		Expect(err).NotTo(HaveOccurred())
	})

	// tear down test level constants and anything else
	AfterAll(func() {
		server.Close()
	})
})
