package integration_tests_test

import (
	"github.com/AudiusProject/audius-protocol/core"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Hello", func() {
	Context("Hello function", func() {
		greeting := core.Hello("alec")
		Expect(greeting).To(Equal("Hello, alec"))
	})
})
