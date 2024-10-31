package integration_test

import (
	"context"
	"time"

	gen_proto "github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/grpc"
	"github.com/AudiusProject/audius-protocol/pkg/core/test/integration/utils"
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"google.golang.org/protobuf/proto"
)

var _ = Describe("EntityManager", func() {
	It("sends and retrieves an entity manager transaction", func() {
		ctx := context.Background()

		sdk := utils.DiscoveryOne

		manageEntity := &gen_proto.ManageEntityLegacy{
			UserId:     1,
			EntityType: "User",
			EntityId:   1,
			Action:     "Create",
			Metadata:   "some json",
			Signature:  "eip712",
		}

		signedManageEntity := &gen_proto.SignedTransaction{
			RequestId: uuid.NewString(),
			Transaction: &gen_proto.SignedTransaction_ManageEntity{
				ManageEntity: manageEntity,
			},
		}

		expectedTxHash, err := grpc.ToTxHash(signedManageEntity)
		Expect(err).To(BeNil())

		req := &gen_proto.SendTransactionRequest{
			Transaction: signedManageEntity,
		}

		submitRes, err := sdk.SendTransaction(ctx, req)
		Expect(err).To(BeNil())

		txhash := submitRes.GetTxhash()
		Expect(expectedTxHash).To(Equal(txhash))

		time.Sleep(time.Second * 1)

		manageEntityRes, err := sdk.GetTransaction(ctx, &gen_proto.GetTransactionRequest{Txhash: txhash})
		Expect(err).To(BeNil())

		Expect(proto.Equal(signedManageEntity, manageEntityRes.GetTransaction())).To(BeTrue())

		// test rpc get hash works too
		txResult, err := sdk.Tx(ctx, []byte(txhash), true)
		Expect(err).To(BeNil())
		Expect(txResult.Hash.Bytes()).To(Equal([]byte(txhash)))
	})
})
