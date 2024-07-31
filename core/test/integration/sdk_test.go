package integration_test

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/sdk"
)

var _ = Describe("Sdk", func() {
	It("connects to json rpc endpoint", func() {
		ctx := context.Background()

		logger := common.NewLogger(nil)
		sdk, err := sdk.NewSdk(sdk.WithLogger(logger), sdk.WithGrpcendpoint(""), sdk.WithJrpcendpoint("http://0.0.0.0:6611"))
		Expect(err).To(BeNil())

		_, err = sdk.Health(ctx)
		Expect(err).To(BeNil())
	})
})
