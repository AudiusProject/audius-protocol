package integration_test

import (
	"context"

	"github.com/cometbft/cometbft/rpc/client/http"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("KvStore", func() {
	It("should be on the same network and peer", func() {
		ctx := context.Background()

		discovery1rpc, err := http.New("http://core-discovery-1:26657")
		Expect(err).To(BeNil())

		res, err := discovery1rpc.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err := discovery1rpc.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(0)) // TODO

		content1rpc, err := http.New("http://core-content-1:26657")
		Expect(err).To(BeNil())

		res, err = content1rpc.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = content1rpc.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(0)) // TODO

		content2rpc, err := http.New("http://core-content-2:26657")
		Expect(err).To(BeNil())

		res, err = content2rpc.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = content2rpc.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(0)) // TODO

		content3rpc, err := http.New("http://core-content-3:26657")
		Expect(err).To(BeNil())

		res, err = content3rpc.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = content3rpc.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(0)) // TODO
	})
})
