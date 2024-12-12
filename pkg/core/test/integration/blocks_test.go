package integration_test

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/test/integration/utils"
)

var _ = Describe("Block", func() {
	It("walks up created blocks", func() {
		ctx := context.Background()

		sdk := utils.ContentOne

		infoRes, err := sdk.GetNodeInfo(ctx, &core_proto.GetNodeInfoRequest{})
		Expect(err).To(BeNil())

		var blockOne *core_proto.BlockResponse
		var blockTwo *core_proto.BlockResponse
		var blockThree *core_proto.BlockResponse

		// index first three blocks
		// we return a success response with -1 if block does not exist
		for {
			blockOneRes, err := sdk.GetBlock(ctx, &core_proto.GetBlockRequest{Height: 1})
			Expect(err).To(BeNil())
			if blockOneRes.Height > 0 {
				blockOne = blockOneRes
			}

			blockTwoRes, err := sdk.GetBlock(ctx, &core_proto.GetBlockRequest{Height: 2})
			Expect(err).To(BeNil())
			if blockOneRes.Height > 0 {
				blockTwo = blockTwoRes
			}

			blockThreeRes, err := sdk.GetBlock(ctx, &core_proto.GetBlockRequest{Height: 3})
			Expect(err).To(BeNil())
			if blockOneRes.Height > 0 {
				blockThree = blockThreeRes
			}

			if blockOne != nil && blockTwo != nil && blockThree != nil {
				break
			}
		}

		Expect(blockOne.Chainid).To(Equal(infoRes.Chainid))
		Expect(blockOne.Height).To(Equal(int64(1)))

		Expect(blockTwo.Chainid).To(Equal(infoRes.Chainid))
		Expect(blockTwo.Height).To(Equal(int64(2)))

		Expect(blockThree.Chainid).To(Equal(infoRes.Chainid))
		Expect(blockThree.Height).To(Equal(int64(3)))
	})
})
