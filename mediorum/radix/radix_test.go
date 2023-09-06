package radix

import (
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/labstack/echo/v4"
)

const cidV0Img = "QmR8heszZ9RycpEn56QXNPaFAg6NMLswPwMJ5sQ7bvd3TH/150x150.jpg"
const cidV0Track = "QmZy2AYKvFPzwFwi9xUZ5uw4p2K2gavxomXB3HrTvtHyPH"
const cidV1 = "baeaaaiqsebw3zqkqkgveihz2slrhspcflzvvz7ncd6nm3oxtten3joesqczfk"

func TestRadix(t *testing.T) {
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

func TestShareViews(t *testing.T) {
	assertHostsWithCID := func(r *Radix, cid string, expected []string) {
		t.Helper()
		hosts := r.GetHostsWithCID(cid)
		if !areSetsEqual(hosts, expected) {
			t.Errorf("GetHostsWithCID(%q) = %v; expected %v", cid, hosts, expected)
		}
	}

	assertOtherHostsViews := func(r *Radix, cid string, expected map[string][]string) {
		t.Helper()
		otherHostViews := r.GetOtherViewsOfHostsWithCID(cid)
		if !reflect.DeepEqual(expected, otherHostViews) {
			t.Errorf("GetOtherViewsOfHostsWithCID(%q) = %v; expected %v", cid, otherHostViews, expected)
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

	// create 3 test servers, each with their own radix tree
	servers, radixes := mockServers(3)
	s1, s2, s3, r1, r2, r3 := servers[0], servers[1], servers[2], radixes[0], radixes[1], radixes[2]
	defer s1.Close()
	defer s2.Close()
	defer s3.Close()

	// make sure they all start out empty
	assertHostsWithCID(r1, cidV0Img, []string{})
	assertHostsWithCID(r1, cidV0Track, []string{})
	assertHostsWithCID(r1, cidV1, []string{})
	assertOtherHostsViews(r1, cidV0Img, map[string][]string{})
	assertOtherHostsViews(r1, cidV0Track, map[string][]string{})
	assertOtherHostsViews(r1, cidV1, map[string][]string{})

	// add cidV0Img to some nodes
	r1.SetHostHasCID(s1.URL, cidV0Img)
	r1.SetHostHasCID(s2.URL, cidV0Img)
	r2.SetHostHasCID(s1.URL, cidV0Img)
	r2.SetHostHasCID(s2.URL, cidV0Img)
	r2.SetHostHasCID(s3.URL, cidV0Img)
	r3.SetHostHasCID(s1.URL, cidV0Img)
	r3.SetHostHasCID(s3.URL, cidV0Img)

	// make sure each node only knows about its own view of cidV0Img
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL})
	assertHostsWithCID(r2, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV0Img, []string{s1.URL, s3.URL})

	// make the first host (r1) request the view of the second host (r2)
	r1.InsertOtherHostsView(s2.URL, 2)

	// make sure r1 still has its own view and now has r2's view as well (but not r3's view yet)
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL})
	assertOtherHostsViews(r1, cidV0Img, map[string][]string{
		s2.URL: {s1.URL, s2.URL, s3.URL},
	})

	// make the first host (r1) request the view of the third host (r3)
	r1.InsertOtherHostsView(s3.URL, 100)

	// make sure r1 still has its own view and now has both r2's view and r3's view
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL})
	assertOtherHostsViews(r1, cidV0Img, map[string][]string{
		s2.URL: {s1.URL, s2.URL, s3.URL},
		s3.URL: {s1.URL, s3.URL},
	})

	// add some more CIDs
	r1.SetHostHasCID(s1.URL, cidV0Track)
	r2.SetHostHasCID(s2.URL, cidV1)
	r3.SetHostHasCID(s2.URL, cidV1)
	r3.SetHostHasCID(s3.URL, cidV1)

	// make the second host (r2) request the view of r1 and r3
	r2.InsertOtherHostsView(s1.URL, 1)
	r2.InsertOtherHostsView(s3.URL, 1)

	// make sure each  host's own view of of cidV0Img is correct
	assertHostsWithCID(r1, cidV0Img, []string{s1.URL, s2.URL})
	assertHostsWithCID(r2, cidV0Img, []string{s1.URL, s2.URL, s3.URL})
	assertHostsWithCID(r3, cidV0Img, []string{s1.URL, s3.URL})

	// make sure each  host's own view of cidV0Track is correct
	assertHostsWithCID(r1, cidV0Track, []string{s1.URL})
	assertHostsWithCID(r2, cidV0Track, []string{})
	assertHostsWithCID(r3, cidV0Track, []string{})

	// make sure each  host's own view of cidV1 is correct
	assertHostsWithCID(r1, cidV1, []string{})
	assertHostsWithCID(r2, cidV1, []string{s2.URL})
	assertHostsWithCID(r3, cidV1, []string{s2.URL, s3.URL})

	// make sure each host has the correct view from other hosts for cidV0Img
	assertOtherHostsViews(r1, cidV0Img, map[string][]string{
		s2.URL: {s1.URL, s2.URL, s3.URL},
		s3.URL: {s1.URL, s3.URL},
	})
	assertOtherHostsViews(r2, cidV0Img, map[string][]string{
		s1.URL: {s1.URL, s2.URL},
		s3.URL: {s1.URL, s3.URL},
	})
	assertOtherHostsViews(r3, cidV0Img, map[string][]string{})

	// make sure each host has the correct view from other hosts for cidV0Track
	assertOtherHostsViews(r1, cidV0Track, map[string][]string{})
	assertOtherHostsViews(r2, cidV0Track, map[string][]string{
		s1.URL: {s1.URL},
	})
	assertOtherHostsViews(r3, cidV0Track, map[string][]string{})

	// make sure each host has the correct view from other hosts for cidV1
	assertOtherHostsViews(r1, cidV1, map[string][]string{})
	assertOtherHostsViews(r2, cidV1, map[string][]string{
		s3.URL: {s2.URL, s3.URL},
	})
	assertOtherHostsViews(r3, cidV1, map[string][]string{})

	// TODO: test deletions and sharing deletions (sharing won't work yet until delta tracking is implemented)
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
