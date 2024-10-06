package integration_test

import (
	"context"

	"github.com/AudiusProject/audius-protocol/pkg/core/test/integration/utils"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Network", func() {
	It("should be on the same network and peer", func() {
		ctx := context.Background()

		res, err := utils.DiscoveryOne.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err := utils.DiscoveryOne.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(3))

		res, err = utils.ContentOne.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = utils.ContentOne.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(3))

		res, err = utils.ContentTwo.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = utils.ContentTwo.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(3))

		res, err = utils.ContentThree.Status(ctx)
		Expect(err).To(BeNil())
		Expect(res.NodeInfo.Network).To(Equal("audius-devnet"))

		netRes, err = utils.ContentThree.NetInfo(ctx)
		Expect(err).To(BeNil())
		Expect(netRes.NPeers).To(Equal(3))
	})
})
