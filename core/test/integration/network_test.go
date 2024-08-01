package integration_test

import (
	"context"

	"github.com/cometbft/cometbft/rpc/client/http"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Network", func() {
	It("should be on the same network and peer", func() {
		ctx := context.Background()

		discovery1rpc, err := http.New("http://localhost:6611")
		Expect(err).To(BeNil())

		res, err := discovery1rpc.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err := discovery1rpc.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(3))

		content1rpc, err := http.New("http://localhost:6711")
		Expect(err).To(BeNil())

		res, err = content1rpc.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = content1rpc.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(1))

		content2rpc, err := http.New("http://localhost:6721")
		Expect(err).To(BeNil())

		res, err = content2rpc.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = content2rpc.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(1))

		content3rpc, err := http.New("http://localhost:6731")
		Expect(err).To(BeNil())

		res, err = content3rpc.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = content3rpc.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(1))
	})
})
