package trendingserver_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestTrendingserver(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Trendingserver Suite")
}
