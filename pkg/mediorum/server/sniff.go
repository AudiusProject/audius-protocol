package server

import (
	"sync"

	"gocloud.dev/blob"
	"golang.org/x/exp/slices"
)

type HostAttrSniff struct {
	Host           string
	Attr           *blob.Attributes
	RendezvousRank int
}

// calls /internal/blobs/info/:cid
// for every host to collect the size reported by each host.
// useful for finding truncated Qm audio CIDs.
func (ss *MediorumServer) sniffAndFix(cid string, fix bool) []HostAttrSniff {
	preferred, _ := ss.rendezvousAllHosts(cid)
	var attrs []HostAttrSniff

	mu := sync.Mutex{}
	wg := sync.WaitGroup{}
	wg.Add(len(preferred))

	for idx, host := range preferred {
		idx := idx
		host := host
		go func() {
			if attr, err := ss.hostGetBlobInfo(host, cid); err == nil {
				mu.Lock()
				attrs = append(attrs, HostAttrSniff{
					Host:           host,
					Attr:           attr,
					RendezvousRank: idx + 1,
				})
				mu.Unlock()
			}
			wg.Done()
		}()
	}
	wg.Wait()

	slices.SortFunc(attrs, func(a, b HostAttrSniff) int {
		// prefer larger size
		if a.Attr.Size > b.Attr.Size {
			return -1
		} else if a.Attr.Size < b.Attr.Size {
			return 1
		}

		// equal size? prefer lower RendezvousRank
		if a.RendezvousRank < b.RendezvousRank {
			return -1
		}
		return 1
	})

	if fix && len(attrs) > 0 {
		best := attrs[0]
		for _, a := range attrs {
			if a.Attr.Size < best.Attr.Size {
				break
			}
			if err := ss.pullFileFromHost(a.Host, cid); err == nil {
				break
			}
		}
	}

	return attrs
}
