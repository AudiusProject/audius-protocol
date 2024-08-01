package integration_test

import (
	"context"
	"time"

	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/core/sdk"
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("KvStore", func() {
	It("should set kv values on one node and read on the others", func() {
		ctx := context.Background()

		discoverySdk, err := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6612"))
		Expect(err).To(BeNil())

		req := &proto.SetKeyValueRequest{
			Key:   uuid.NewString(),
			Value: uuid.NewString(),
		}

		res, err := discoverySdk.SetKeyValue(ctx, req)
		Expect(err).To(BeNil())
		Expect(res.Key).To(Equal(req.Key))
		Expect(res.Value).To(Equal(req.Value))

		time.Sleep(time.Second * 2)

		contentOneSdk, err := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6712"))
		Expect(err).To(BeNil())

		queryRes, err := contentOneSdk.GetKeyValue(ctx, &proto.GetKeyValueRequest{Key: req.Key})
		Expect(err).To(BeNil())
		Expect(queryRes.Key).To(Equal(req.Key))
		Expect(queryRes.Value).To(Equal(req.Value))
	})
})
