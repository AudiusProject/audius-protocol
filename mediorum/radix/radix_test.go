package radix

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

const cidV0Img = "QmR8heszZ9RycpEn56QXNPaFAg6NMLswPwMJ5sQ7bvd3TH/150x150.jpg"
const cidV0Track = "QmZy2AYKvFPzwFwi9xUZ5uw4p2K2gavxomXB3HrTvtHyPH"
const cidV1 = "baeaaaiqsebw3zqkqkgveihz2slrhspcflzvvz7ncd6nm3oxtten3joesqczfk"

func TestAddDeleteCID(t *testing.T) {
	r := New("https://myhost.com", []string{"https://host1.com", "https://host2.com", "https://host3.com"})

	assertHostsWithCID := func(cid string, expected []string) {
		t.Helper()
		hosts := r.GetHostsWithCID(cid)
		if !areSetsEqual(hosts, expected) {
			t.Errorf("GetHostsWithCID(%q) = %v; expected %v", cid, hosts, expected)
		}
	}

	assertHostsWithCID("baeaaaiqseRestOfCIDV1", []string{})

	r.SetHostHasCID("https://host1.com", "baeaaaiqseRestOfCIDV1")
	assertHostsWithCID("baeaaaiqseRestOfCIDV1", []string{"https://host1.com"})

	r.SetHostHasCID("https://host2.com", "baeaaaiqseRestOfCIDV1")
	assertHostsWithCID("baeaaaiqseRestOfCIDV1", []string{"https://host1.com", "https://host2.com"})

	r.SetHostNotHasCID("https://host1.com", "baeaaaiqseRestOfCIDV1")
	assertHostsWithCID("baeaaaiqseRestOfCIDV1", []string{"https://host2.com"})

	r.SetHostHasCID("https://host1.com", "QmCID")
	assertHostsWithCID("QmCID", []string{"https://host1.com"})

	r.SetHostHasCID("https://host3.com", "QmCID/150x150.jpg")
	assertHostsWithCID("QmCID/150x150.jpg", []string{"https://host3.com"})

	r.SetHostHasCID("https://host3.com", "QmCID")
	assertHostsWithCID("QmCID", []string{"https://host1.com", "https://host3.com"})

	r.SetHostNotHasCID("https://host2.com", "baeaaaiqseRestOfCIDV1")
	assertHostsWithCID("baeaaaiqseRestOfCIDV1", []string{})

	r.SetHostNotHasCID("https://host3.com", "QmCID/150x150.jpg")
	assertHostsWithCID("QmCID/150x150.jpg", []string{})

	r.SetHostNotHasCID("https://host1.com", "QmCID")
	assertHostsWithCID("QmCID", []string{"https://host3.com"})
}

// tests:
// 1. adding (SetHostHasCID)
// 2. gossiping adds (first party and third party) plus pagination
// 3. deleting (SetHostNotHasCID)
// 4. gossiping deletes (first party and third party)
// 5. adding back after deleting (SetHostHasCID again)
// 6. gossiping adding back after deleting (first party and third party)
// 7. deleting after adding back (SetHostNotHasCID again)
// 8. gossiping deleting after adding back (first party and third party)
// 9. a new node applying the state of the network
// 10. one host marking itself as having a CID, and another host marking itself as _not_ having the same CID
func TestGossip(t *testing.T) {
	assertHostsWithCID := func(r *Radix, cid string, expected []string) {
		t.Helper()
		hosts := r.GetHostsWithCID(cid)
		if !areSetsEqual(hosts, expected) {
			t.Errorf("GetHostsWithCID(%q) = %v; expected %v", cid, hosts, expected)
		}
	}

	mockServers := func(numServers int) ([]*httptest.Server, []*Radix) {
		servers := make([]*httptest.Server, numServers)
		radixes := make([]*Radix, numServers)
		for i := 0; i < numServers; i++ {
			localI := i
			servers[i] = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
				e := echo.New()
				c := e.NewContext(req, w)
				radixes[localI].ServeTreePaginatedInternal(c)
			}))
		}

		otherHostsMap := make(map[int][]string, numServers)
		for i := 0; i < numServers; i++ {
			otherHostsMap[i] = make([]string, 0, numServers-1)
			for j := 0; j < numServers; j++ {
				if j != i {
					otherHostsMap[i] = append(otherHostsMap[i], servers[j].URL)
				}
			}
		}
		for i := 0; i < numServers; i++ {
			radixes[i] = New(servers[i].URL, otherHostsMap[i])
		}
		return servers, radixes
	}

	// create 5 test servers, each with their own radix tree
	servers, radixes := mockServers(5)
	s1, s2, s3, s4, s5, r1, r2, r3, r4, r5 := servers[0], servers[1], servers[2], servers[3], servers[4], radixes[0], radixes[1], radixes[2], radixes[3], radixes[4]
	defer s1.Close()
	defer s2.Close()
	defer s3.Close()
	defer s4.Close()
	defer s5.Close()

	// make sure all hosts start out having no CIDs
	assertHostsWithCID(r1, cidV0Img, []string{})
	assertHostsWithCID(r1, cidV0Track, []string{})
	assertHostsWithCID(r1, cidV1, []string{})
	assertHostsWithCID(r2, cidV0Img, []string{})
	assertHostsWithCID(r2, cidV0Track, []string{})
	assertHostsWithCID(r2, cidV1, []string{})
	assertHostsWithCID(r3, cidV0Img, []string{})
	assertHostsWithCID(r3, cidV0Track, []string{})
	assertHostsWithCID(r3, cidV1, []string{})
	assertHostsWithCID(r4, cidV0Img, []string{})
	assertHostsWithCID(r4, cidV0Track, []string{})
	assertHostsWithCID(r4, cidV1, []string{})
	assertHostsWithCID(r5, cidV0Img, []string{})
	assertHostsWithCID(r5, cidV0Track, []string{})
	assertHostsWithCID(r5, cidV1, []string{})

	// 1. test own adding:
	// each host can mark any host (including itself) as having a CID
	r1.SetHostHasCID(s1.URL, cidV0Img)
	r1.SetHostHasCID(s2.URL, cidV0Img)
	r2.SetHostHasCID(s1.URL, cidV0Img)
	r2.SetHostHasCID(s2.URL, cidV0Img)
	r2.SetHostHasCID(s3.URL, cidV0Img)
	r3.SetHostHasCID(s1.URL, cidV0Img)
	r3.SetHostHasCID(s3.URL, cidV0Img)
	r4.SetHostHasCID(s4.URL, cidV0Img)
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL})
	assertHostsWithCID(r2, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV0Img, []string{s1.URL, s3.URL})

	// 2. test valid first-party gossip adding:
	// when host2 gossips to host1, host1 should realize that host2 has cidV0Img
	r1.InsertOtherHostsView(s2.URL, 2, false)
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL, s3.URL})

	// 2. test valid first-party gossip adding (with higher pagination):
	// when host3 gossips to host1, host1 should realize that host3 has cidV0Img
	r1.InsertOtherHostsView(s3.URL, 100, false)
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL, s3.URL})

	// add some more CIDs to hosts
	r1.SetHostHasCID(s1.URL, cidV0Track)
	r2.SetHostHasCID(s2.URL, cidV1)
	r3.SetHostHasCID(s2.URL, cidV1)
	r3.SetHostHasCID(s3.URL, cidV1)

	// 2. test valid first-party gossip adding (with lower pagination of additional CIDs):
	// when host1 and then host3 gossips to host2, host2 should see all additions from both without duplicates
	r2.InsertOtherHostsView(s1.URL, 1, false)
	r2.InsertOtherHostsView(s3.URL, 1, false)
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r2, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV0Img, []string{s1.URL, s3.URL})
	assertHostsWithCID(r1, cidV0Track, []string{s1.URL})
	assertHostsWithCID(r2, cidV0Track, []string{s1.URL})
	assertHostsWithCID(r3, cidV0Track, []string{})
	assertHostsWithCID(r1, cidV1, []string{})
	assertHostsWithCID(r2, cidV1, []string{s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV1, []string{s2.URL, s3.URL})

	// 2. test valid third-party gossip adding (with multiple CIDs):
	// when host2 gossips to host3, host3 should realize that host2 has cidV0Img and host1 has cidV0Track
	r3.InsertOtherHostsView(s2.URL, 100, false)
	assertHostsWithCID(r3, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV0Track, []string{s1.URL})

	// gossip host3 to host4 so we can later test host4 gossipping old updates (which should be ignored)
	r4.InsertOtherHostsView(s3.URL, 100, false)
	assertHostsWithCID(r4, cidV0Img, []string{s1.URL, s2.URL, s3.URL, s4.URL})
	assertHostsWithCID(r4, cidV0Track, []string{s1.URL})

	// 3. test own deleting:
	// when host1 marks itself as not having cidV0Img, only host1 should know it doesn't have cidV0Img
	r1.SetHostNotHasCID(s1.URL, cidV0Img)
	assertHostsWithCID(r1, cidV0Img, []string{s2.URL, s3.URL})
	assertHostsWithCID(r2, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV0Img, []string{s1.URL, s2.URL, s3.URL})

	// 4. test valid first-party gossip deleting:
	// when host1 gossips to host2, host2 should realize that host1 no longer has cidV0Img
	r2.InsertOtherHostsView(s1.URL, 100, false)
	assertHostsWithCID(r2, cidV0Img, []string{s2.URL, s3.URL})

	// 4. test valid third-party gossip deleting:
	// when host2 gossips to host3, host3 should realize that host1 longer has cidV0Img
	r3.InsertOtherHostsView(s2.URL, 100, false)
	assertHostsWithCID(r3, cidV0Img, []string{s2.URL, s3.URL})

	// 5. test own adding back after deleting:
	// when host1 marks itself as having cidV0Img, only host1 should say it has cidV0Img (except for host4 which is out of date)
	r1.SetHostHasCID(s1.URL, cidV0Img)
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r2, cidV0Img, []string{s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV0Img, []string{s2.URL, s3.URL})
	assertHostsWithCID(r4, cidV0Img, []string{s1.URL, s2.URL, s3.URL, s4.URL})

	// 6. test valid first-party gossip adding back after deleting:
	// when host1 gossips to host2, host2 should add back cidV0Img to host1 even though it previously deleted it (because host1 knew about the previous deletion and removed the tombstone)
	r2.InsertOtherHostsView(s1.URL, 100, false)
	assertHostsWithCID(r2, cidV0Img, []string{s1.URL, s2.URL, s3.URL})

	// 6. test out of date third-party gossip attempting to add back after deleting (should be ignored):
	// when host4 gossips to host3, host3 should still know that host1 doesn't have cidV0Img even though host4 says it does (because host4 is out of date - it's not removing a tombstone)
	r3.InsertOtherHostsView(s4.URL, 100, false)
	assertHostsWithCID(r3, cidV0Img, []string{s2.URL, s3.URL, s4.URL})

	// 6. test valid third-party gossip adding back after deleting:
	// when host1 gossips to host4, host4 should be able to gossip to host3 that host1 has cidV0Img again (after host1 previously had it and then didn't have it)
	r4.InsertOtherHostsView(s1.URL, 100, false)
	assertHostsWithCID(r4, cidV0Img, []string{s1.URL, s2.URL, s3.URL, s4.URL})
	r3.InsertOtherHostsView(s4.URL, 100, false)
	assertHostsWithCID(r3, cidV0Img, []string{s1.URL, s2.URL, s3.URL, s4.URL})

	// 7. test own deleting after adding back:
	// when host1 marks itself as not having cidV0Img, host1 should know it doesn't have cidV0Img, and other hosts should remain unchanged
	r1.SetHostNotHasCID(s1.URL, cidV0Img)
	assertHostsWithCID(r1, cidV0Img, []string{s2.URL, s3.URL})
	assertHostsWithCID(r2, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV0Img, []string{s1.URL, s2.URL, s3.URL, s4.URL})
	assertHostsWithCID(r4, cidV0Img, []string{s1.URL, s2.URL, s3.URL, s4.URL})

	// for cidV0Img we previously added host1, then deleted, then added, and now are deleting again
	// as a result, host2's final state of "does host1 have cidV0Img?" is the same now as when it last gossipped to host3
	// since host3 gossipped from host4, host3 sees a change to that state but as far as host2 is concerned it's sent all its updates to host3
	// so tldr let's update the cursor that host2 has to host3 so that 2 tests from now (third-party gossip deleting after adding back) host2 will send the change to host3
	r3.InsertOtherHostsView(s2.URL, 100, false)

	// 8. test valid first-party gossip deleting after adding back:
	// when host1 gossips to host2, host2 should realize that host1 no longer has cidV0Img
	r2.InsertOtherHostsView(s1.URL, 100, false)
	assertHostsWithCID(r2, cidV0Img, []string{s2.URL, s3.URL})

	// 8. test valid third-party gossip deleting after adding back:
	// when host2 gossips to host3, host3 should realize that host1 longer has cidV0Img
	r3.InsertOtherHostsView(s2.URL, 100, false)
	assertHostsWithCID(r3, cidV0Img, []string{s2.URL, s3.URL, s4.URL})

	// 9. test new node applying the state of the network
	// it should be fully up to date from just one node
	r4.InsertOtherHostsView(s3.URL, 100, false)
	r5.InsertOtherHostsView(s4.URL, 100, false)
	assertHostsWithCID(r5, cidV0Img, []string{s2.URL, s3.URL, s4.URL})
	assertHostsWithCID(r5, cidV0Track, []string{s1.URL})
	assertHostsWithCID(r5, cidV1, []string{s2.URL, s3.URL})
	// but inevitably it will fetch CIDs from every node, so we'll test that as well
	r5.InsertOtherHostsView(s3.URL, 100, false)
	r5.InsertOtherHostsView(s2.URL, 100, false)
	r5.InsertOtherHostsView(s1.URL, 100, false)
	assertHostsWithCID(r5, cidV0Img, []string{s2.URL, s3.URL, s4.URL})
	assertHostsWithCID(r5, cidV0Track, []string{s1.URL})
	assertHostsWithCID(r5, cidV1, []string{s2.URL, s3.URL})

	// 10. test one host marking itself as having a CID, and another host marking itself as _not_ having the same CID
	anotherCidV1 := "baeaaaiqsebw3zqkqkgveihz2slrhspcflzvvz7ncd6nm3oxtten3joesqczfl"
	r1.SetHostHasCID(s1.URL, anotherCidV1)
	r2.SetHostNotHasCID(s2.URL, anotherCidV1)
	assertHostsWithCID(r1, anotherCidV1, []string{s1.URL})
	assertHostsWithCID(r2, anotherCidV1, []string{})
	r1.InsertOtherHostsView(s2.URL, 100, false)
	assertHostsWithCID(r1, anotherCidV1, []string{s1.URL})

	// 10. test one host marking itself as having a CID, and another host marking itself as _not_ having the same CID
	r3.SetHostHasCID(s3.URL, anotherCidV1)
	r4.SetHostNotHasCID(s4.URL, anotherCidV1)
	assertHostsWithCID(r3, anotherCidV1, []string{s3.URL})
	assertHostsWithCID(r4, anotherCidV1, []string{})
	r4.InsertOtherHostsView(s3.URL, 100, false)
	assertHostsWithCID(r4, anotherCidV1, []string{s3.URL})
}

func TestCompressDecompress(t *testing.T) {
	tests := []struct {
		inputCID    string
		expectedKey string
	}{
		{"baeaaaiqseRestOfCIDV1", "`RestOfCIDV1"},
		{"baCIDV1ThatDoesn'tHaveOurPrefix", "baCIDV1ThatDoesn'tHaveOurPrefix"},
		{"QmCID/original.jpg", "~QmCID"},
		{"AnotherQmCID/150x150.jpg", "!AnotherQmCID"},
		{"RandomKey", "RandomKey"},
	}

	for _, test := range tests {
		t.Run(test.inputCID, func(t *testing.T) {
			// test compressCID
			gotKey := compressCID(test.inputCID)
			if gotKey != test.expectedKey {
				t.Errorf("compressCID(%q) = %q; expected %q", test.inputCID, gotKey, test.expectedKey)
			}

			// test decompressKey
			gotCID := decompressKey(test.expectedKey)
			if gotCID != test.inputCID {
				t.Errorf("decompressKey(%q) = %q; expected %q", test.expectedKey, gotCID, test.inputCID)
			}
		})
	}
}
