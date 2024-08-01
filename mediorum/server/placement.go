package server

import (
	"bytes"
	"crypto/sha256"
	"io"
	"net/url"
	"sort"
	"strings"

	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) rendezvousAllHosts(key string) ([]string, bool) {
	orderedHosts := ss.rendezvousHasher.Rank(key)

	myRank := slices.Index(orderedHosts, ss.Config.Self.Host)
	isMine := myRank >= 0 && myRank < ss.Config.ReplicationFactor

	if ss.Config.StoreAll {
		isMine = true
	}
	return orderedHosts, isMine
}

type HostTuple struct {
	host  string
	score []byte
}

type HostTuples []HostTuple

func (s HostTuples) Len() int      { return len(s) }
func (s HostTuples) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s HostTuples) Less(i, j int) bool {
	c := bytes.Compare(s[i].score, s[j].score)
	if c == 0 {
		return s[i].host < s[j].host
	}
	return c == -1
}

func NewRendezvousHasher(hosts []string) *RendezvousHasher {
	deadHosts := "https://content.grassfed.network/"
	liveHosts := make([]string, 0, len(hosts))
	for _, h := range hosts {
		// dead host
		if strings.Contains(deadHosts, h) {
			continue
		}

		// invalid url
		if _, err := url.Parse(h); err != nil {
			continue
		}

		// duplicate entry
		if slices.Contains(liveHosts, h) {
			continue
		}

		liveHosts = append(liveHosts, h)
	}
	return &RendezvousHasher{
		hosts: liveHosts,
	}
}

type RendezvousHasher struct {
	hosts []string
}

func (rh *RendezvousHasher) Rank(key string) []string {
	tuples := make(HostTuples, len(rh.hosts))
	keyBytes := []byte(key)
	hasher := sha256.New()
	for idx, host := range rh.hosts {
		hasher.Reset()
		io.WriteString(hasher, host)
		hasher.Write(keyBytes)
		tuples[idx] = HostTuple{host, hasher.Sum(nil)}
	}
	sort.Sort(tuples)
	result := make([]string, len(rh.hosts))
	for idx, tup := range tuples {
		result[idx] = tup.host
	}
	return result
}
