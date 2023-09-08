package radix

// TODO: if the set of registered nodes changes then we need to start rebuilding the tree from scratch

// TODO: if memory grows too large, we can prune tombstones with 0 value (no hosts) on some interval (any interval > how often every host fetches updates from other hosts)

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"

	iradix "github.com/hashicorp/go-immutable-radix/v2"
	"github.com/labstack/echo/v4"
	"golang.org/x/exp/maps"
	"golang.org/x/exp/slices"
)

var (
	baCompressedChar = "`"          // anything non-base32 will do
	baPrefix         = "baeaaaiqse" // all CIDV1s start with this, while CIDV0s start with "Qm"
	tombstoneSuffix  = "_"          // keys ending with this map to values containing hosts that don't have the CID

	// save space by changing common suffixes like "/150x150x.jpg" to a prefix like "!" - anything non-base58 will do
	suffixCompressedChars = map[string]string{
		"/original.jpg":  "~",
		"/150x150.jpg":   "!",
		"/480x480.jpg":   "@",
		"/1000x1000.jpg": "#",
		"/640x.jpg":      "$",
		"/2000x.jpg":     "%",
	}
)

// Radix tells you which hosts store which CIDs.
// It's limited to 255 hosts (uint8) and 65535 combinations of hosts having CIDs.
// Increase these types when more hosts or combinations are needed.
type Radix struct {
	NumCIDsOnMyHost uint // "CIDs I double-checked that I'm storing during repair.go"
	NumCIDsTotal    uint // "CIDs I checked in repair.go (even if I ignored them because I'm not in the top R rendezvous)"

	myHost       string
	cursors      map[string]*iradix.Tree[uint16] // cursors for other hosts so we don't send them the same CIDs we already sent before
	tree         *iradix.Tree[uint16]
	mu           sync.RWMutex
	idToHost     map[uint8]string   // ints representing a node (to save space so we don't have to store the full host string)
	combinations map[uint16][]uint8 // ints representing a set/combination of nodes that have a CID (to store at radix leaves). 0 is reserved for "no hosts have this CID"
}

func New(myHost string, otherHosts []string) (r *Radix) {
	// remove self from otherHosts
	for i, host := range otherHosts {
		if host == myHost {
			otherHosts = append(otherHosts[:i], otherHosts[i+1:]...)
			break
		}
	}

	if len(otherHosts) >= 255 {
		panic("too many hosts - increase uint8 to uint16")
	}

	r = &Radix{
		tree:         iradix.New[uint16](),
		myHost:       myHost,
		cursors:      make(map[string]*iradix.Tree[uint16], len(otherHosts)),
		idToHost:     make(map[uint8]string, len(otherHosts)),
		combinations: make(map[uint16][]uint8, 65535),
	}

	r.idToHost[0] = myHost
	for i, otherHost := range otherHosts {
		r.idToHost[uint8(i+1)] = otherHost
		r.cursors[otherHost] = r.tree.Txn().CommitOnly()
	}

	return
}

// GetHostsWithCID returns the hosts that we confirmed to have the given CID.
// Note that this doesn't confirm that any host doesn't have the CID - they may have it but we haven't checked yet, or we haven't been told about it yet by a node that did check it
func (r *Radix) GetHostsWithCID(cid string) []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	key := compressCID(cid)
	hosts := []string{}
	idx, ok := r.tree.Get([]byte(key))
	if ok {
		nodes := r.combinations[idx]
		for _, node := range nodes {
			hosts = append(hosts, r.idToHost[node])
		}
	}
	return hosts
}

// SetHostHasCID should only be called after checking a host and confirming it has the given CID
func (r *Radix) SetHostHasCID(host, cid string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	key := compressCID(cid)
	r.upsertKey(key, host, true)
}

// SetHostNotHasCID marks the given CID as not existing on the given host
func (r *Radix) SetHostNotHasCID(host, cid string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	key := compressCID(cid)
	r.removeHostFromLeaf(key, host)
}

type ServeCIDInfoResp struct {
	HostsWithCID  []string
	CID           string
	CompressedCID string
}

func (r *Radix) ServeCIDInfo(c echo.Context) error {
	cid := c.Param("cid")
	return c.JSON(http.StatusOK, ServeCIDInfoResp{
		HostsWithCID:  r.GetHostsWithCID(cid),
		CID:           cid,
		CompressedCID: compressCID(cid),
	})
}

const maxPageSize = 100000

type ServeTreeInternalResp struct {
	IdToHost     map[uint8]string
	Combinations map[uint16][]uint8
	Leaves       []LeafEntry
	LastKey      string
}

// used instead of a map to preserve order
type LeafEntry struct {
	Key          string
	HostsWithCID uint16
}

// ServeTreePaginatedInternal returns a paginated list of tree leaves for other Content Nodes to use.
func (r *Radix) ServeTreePaginatedInternal(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// find cursor for the requesting host so we don't send them the same CIDs we already sent before
	host := c.QueryParam("host")
	if _, ok := r.cursors[host]; !ok {
		return c.JSON(http.StatusBadRequest, fmt.Sprintf("host %s not found", host))
	}
	prevTree := r.cursors[host]

	greaterThanKey := c.QueryParam("greaterThanKey")
	pageSize, err := strconv.Atoi(c.QueryParam("pageSize"))
	if err != nil || pageSize > maxPageSize {
		pageSize = maxPageSize
	}

	// reset cursor if requested (the other server requests this when it's starting up so it can get the whole tree)
	resetCursor, _ := strconv.ParseBool(c.QueryParam("resetCursor"))
	if resetCursor {
		r.cursors[host] = iradix.New[uint16]()
	}

	iter := r.tree.Root().Iterator()
	if greaterThanKey != "" {
		iter.SeekLowerBound([]byte(greaterThanKey))
		iter.Next() // skip the greaterThanKey itself
	}

	resp := ServeTreeInternalResp{
		Leaves:       make([]LeafEntry, 0, pageSize),
		IdToHost:     map[uint8]string{},
		Combinations: map[uint16][]uint8{},
	}
	var lastKey string
	for key, val, ok := iter.Next(); ok && len(resp.Leaves) < pageSize; key, val, ok = iter.Next() {
		// skip sending unchanged leaves that we already sent to the requesting host
		if prevVal, ok := prevTree.Get(key); ok && val == prevVal {
			continue
		}

		keyStr := string(key)
		lastKey = keyStr
		resp.Leaves = append(resp.Leaves, LeafEntry{Key: keyStr, HostsWithCID: val})

		// share our mappings so the other host can re-map them to their own IDs
		if !slices.Contains(maps.Keys(resp.Combinations), val) {
			resp.Combinations[val] = r.combinations[val]
			for _, hostID := range r.combinations[val] {
				resp.IdToHost[hostID] = r.idToHost[hostID]
			}
		}
	}

	resp.LastKey = lastKey

	// update our cursor for this host (this "copying" of the tree is pointer-based so it doesn't take up much memory)
	if resp.LastKey == "" {
		r.cursors[host] = r.tree.Txn().CommitOnly()
	}

	return c.JSON(http.StatusOK, resp)
}

type ServeTreeResp struct {
	CIDToHosts map[string][]string
	LastCID    string
}

// ServeTreePaginated returns a paginated list of tree leaves in human-readable format
func (r *Radix) ServeTreePaginated(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	greaterThanCid := c.QueryParam("greaterThanCid")
	pageSize, err := strconv.Atoi(c.QueryParam("pageSize"))
	if err != nil || pageSize > maxPageSize {
		pageSize = maxPageSize
	}

	iter := r.tree.Root().Iterator()
	if greaterThanCid != "" {
		iter.SeekLowerBound([]byte(compressCID(greaterThanCid)))
		iter.Next() // skip the greaterThanCid itself
	}

	resp := ServeTreeResp{
		CIDToHosts: make(map[string][]string, pageSize),
	}
	for key, val, ok := iter.Next(); ok && len(resp.CIDToHosts) < pageSize; key, val, ok = iter.Next() {
		keyStr := string(key)

		// don't expose tombstone keys because this is user-facing
		if strings.HasSuffix(keyStr, tombstoneSuffix) {
			continue
		}

		cid := decompressKey(keyStr)
		hostIDsWithCID := r.combinations[val]
		hostsWithCID := make([]string, 0, len(hostIDsWithCID))
		for _, hostID := range hostIDsWithCID {
			hostsWithCID = append(hostsWithCID, r.idToHost[hostID])
		}

		resp.CIDToHosts[cid] = hostsWithCID
		resp.LastCID = cid
	}

	return c.JSON(http.StatusOK, resp)
}

type ServeReplicationCountsResp struct {
	ReplicationFactorToNumCIDs map[int]int
}

// ServeReplicationCounts returns a mapping of number to the number of CIDs that are replicated by that many hosts
func (r *Radix) ServeReplicationCounts(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	iter := r.tree.Root().Iterator()

	resp := ServeReplicationCountsResp{
		ReplicationFactorToNumCIDs: map[int]int{},
	}

	for key, val, ok := iter.Next(); ok; key, val, ok = iter.Next() {
		// don't count tombstone keys because they don't represent CIDs that exist
		if strings.HasSuffix(string(key), tombstoneSuffix) {
			continue
		}

		hostsWithCID := r.combinations[val]
		resp.ReplicationFactorToNumCIDs[len(hostsWithCID)]++
	}

	return c.JSON(http.StatusOK, resp)
}

type ServeReplicationCIDs struct {
	ReplicationFactor int
	CIDs              []string
	LastCID           string
}

// ServeReplicationCIDsPaginated returns the CIDs that are replicated by the given number of hosts
func (r *Radix) ServeReplicationCIDsPaginated(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	greaterThanCid := c.QueryParam("greaterThanCid")
	pageSize, err := strconv.Atoi(c.QueryParam("pageSize"))
	if err != nil || pageSize > maxPageSize {
		pageSize = maxPageSize
	}
	replicationFactor, err := strconv.Atoi(c.Param("replicationFactor"))
	if err != nil {
		replicationFactor = 3
	}

	iter := r.tree.Root().Iterator()
	if greaterThanCid != "" {
		iter.SeekLowerBound([]byte(compressCID(greaterThanCid)))
		iter.Next() // skip the greaterThanCid itself
	}

	resp := ServeReplicationCIDs{
		ReplicationFactor: replicationFactor,
		CIDs:              make([]string, 0, pageSize),
	}

	for key, val, ok := iter.Next(); ok && len(resp.CIDs) < pageSize; key, val, ok = iter.Next() {
		keyStr := string(key)

		// ignore tombstone keys
		if strings.HasSuffix(keyStr, tombstoneSuffix) {
			continue
		}

		cid := decompressKey(keyStr)
		hostsWithCID := r.combinations[val]
		if replicationFactor == len(hostsWithCID) {
			resp.CIDs = append(resp.CIDs, cid)
		}
		resp.LastCID = cid
	}

	return c.JSON(http.StatusOK, resp)
}

type ServeNumCIDsOnOnlyHostsResp struct {
	Hosts              []string
	NumCIDsOnlyOnHosts int
}

// ServeNumCIDsOnOnlyHosts returns the number of CIDs that are only on the given hosts
func (r *Radix) ServeNumCIDsOnOnlyHosts(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	onlyOnHostsStr := c.QueryParam("hosts")
	onlyOnHosts := strings.Split(onlyOnHostsStr, ",")
	if len(onlyOnHosts) == 0 {
		return c.JSON(http.StatusBadRequest, "no hosts specified")
	}
	for _, host := range onlyOnHosts {
		if _, ok := r.cursors[host]; !ok && host != r.myHost {
			return c.JSON(http.StatusBadRequest, fmt.Sprintf("host %s not found", host))
		}
	}

	iter := r.tree.Root().Iterator()

	resp := ServeNumCIDsOnOnlyHostsResp{
		Hosts: onlyOnHosts,
	}

	for key, val, ok := iter.Next(); ok; key, val, ok = iter.Next() {
		// ignore tombstone keys
		if strings.HasSuffix(string(key), tombstoneSuffix) {
			continue
		}

		hostsWithCID := r.combinations[val]
		if len(hostsWithCID) != len(onlyOnHosts) {
			continue
		}
		for _, host := range onlyOnHosts {
			if !slices.Contains(hostsWithCID, r.getIdForHost(host)) {
				continue
			}
		}
		resp.NumCIDsOnlyOnHosts++
	}

	return c.JSON(http.StatusOK, resp)
}

type ServeCIDsOnOnlyHostsResp struct {
	Hosts           []string
	CIDsOnlyOnHosts []string
	LastCID         string
}

// ServeCIDsOnOnlyHostsPaginated returns the CIDs that are only on the given hosts
func (r *Radix) ServeCIDsOnOnlyHostsPaginated(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	onlyOnHostsStr := c.QueryParam("hosts")
	onlyOnHosts := strings.Split(onlyOnHostsStr, ",")
	if len(onlyOnHosts) == 0 {
		return c.JSON(http.StatusBadRequest, "no hosts specified")
	}
	for _, host := range onlyOnHosts {
		if _, ok := r.cursors[host]; !ok && host != r.myHost {
			return c.JSON(http.StatusBadRequest, fmt.Sprintf("host %s not found", host))
		}
	}

	greaterThanCid := c.QueryParam("greaterThanCid")
	pageSize, err := strconv.Atoi(c.QueryParam("pageSize"))
	if err != nil || pageSize > maxPageSize {
		pageSize = maxPageSize
	}

	iter := r.tree.Root().Iterator()
	if greaterThanCid != "" {
		iter.SeekLowerBound([]byte(compressCID(greaterThanCid)))
		iter.Next() // skip the greaterThanCid itself
	}

	resp := ServeCIDsOnOnlyHostsResp{
		Hosts:           onlyOnHosts,
		CIDsOnlyOnHosts: make([]string, 0, pageSize),
	}

	for key, val, ok := iter.Next(); ok && len(resp.CIDsOnlyOnHosts) < pageSize; key, val, ok = iter.Next() {
		keyStr := string(key)

		// ignore tombstone keys
		if strings.HasSuffix(keyStr, tombstoneSuffix) {
			continue
		}

		cid := decompressKey(keyStr)
		hostsWithCID := r.combinations[val]

		if len(hostsWithCID) != len(onlyOnHosts) {
			continue
		}
		for _, host := range onlyOnHosts {
			if !slices.Contains(hostsWithCID, r.getIdForHost(host)) {
				continue
			}
		}

		resp.CIDsOnlyOnHosts = append(resp.CIDsOnlyOnHosts, cid)
		resp.LastCID = cid
	}

	return c.JSON(http.StatusOK, resp)
}

// InsertOtherHostsView requests leaves from otherHost and inserts them into our own tree (otherHost maintains a cursor so they don't re-send the whole tree to us)
func (r *Radix) InsertOtherHostsView(otherHost string, pageSize int, resetCursor bool) {
	var result ServeTreeInternalResp
	baseURL := fmt.Sprintf("%s/radix/internal/leaves?pageSize=%d&host=%s", otherHost, pageSize, r.myHost)
	for {
		// build paginated URL
		nextURL := baseURL
		if result.LastKey == "" {
			if resetCursor {
				nextURL += "&resetCursor=true"
			}
		} else {
			nextURL = baseURL + "&greaterThanKey=" + result.LastKey
		}

		// fetch next page
		resp, _ := http.Get(nextURL)
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return
		}
		if result.LastKey == "" || result.IdToHost == nil || result.Combinations == nil {
			return
		}

		// add leaves from this page
		r.addLeavesFromOtherHost(otherHost, &result.Leaves, &result.IdToHost, &result.Combinations)
	}
}

func (r *Radix) addLeavesFromOtherHost(otherHost string, leaves *[]LeafEntry, idToHost *map[uint8]string, combinations *map[uint16][]uint8) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, leafOnOtherHost := range *leaves {
		// re-map the other host's IDs to our own
		key := leafOnOtherHost.Key
		leafValOnOtherHost := leafOnOtherHost.HostsWithCID
		idsOnOtherHost := (*combinations)[leafValOnOtherHost]
		updatedHosts := make([]string, 0, len(idsOnOtherHost))
		for _, idOnOtherHost := range idsOnOtherHost {
			host := (*idToHost)[idOnOtherHost]
			if _, ok := r.cursors[host]; !ok && host != r.myHost {
				continue // a new node probably registered that we're not aware of, so we'll ignore it for now
			}

			updatedHosts = append(updatedHosts, host)
		}

		if strings.HasSuffix(key, tombstoneSuffix) {
			// this is a tombstone of hosts that _don't_ have the CID, so remove each host from the leaf in our tree
			nonTombstoneKey := key[:len(key)-len(tombstoneSuffix)]
			for _, host := range updatedHosts {
				r.removeHostFromLeaf(nonTombstoneKey, host)
			}

			// handle hosts that are no longer in the updated tombstone (removing from tombstone = host now has the CID)
			idxOfCurrHostsWithoutCID, ok := r.tree.Get([]byte(key))
			if ok {
				for _, hostIDWithoutCID := range r.combinations[idxOfCurrHostsWithoutCID] {
					hostWithoutCID := r.idToHost[hostIDWithoutCID]
					if !slices.Contains(updatedHosts, hostWithoutCID) {
						r.upsertKey(nonTombstoneKey, hostWithoutCID, true)
					}
				}
			}

			// finally, update our tombstone
			for _, host := range updatedHosts {
				r.upsertKey(key, host, false)
			}

			// edge case: we could've been sent an empty tombstone
			if len(updatedHosts) == 0 {
				r.tree, _, _ = r.tree.Insert([]byte(key), 0)
			}
		} else {
			// add each host to the leaf in our tree unless we've previously marked it as not having this CID
			for _, host := range updatedHosts {
				r.upsertKey(key, host, false)
			}
		}
	}
}

// getOrMakeCombinationsIdx return the index at which a slice of hosts (strings) are stored, or inserts a new slice and returns the index to it.
func (r *Radix) getOrMakeCombinationsIdx(hosts []uint8) uint16 {
	if len(r.combinations) == 0 {
		r.combinations[0] = []uint8{} // 0 is reserved for "no hosts have this CID"
	}

	var i uint32
	for idx, combo := range r.combinations {
		if areSetsEqual(combo, hosts) {
			return idx
		}
		i++
	}

	// no index found - insert new hosts combination
	if i >= 65535 {
		panic("too many combinations - increase uint16 to uint32")
	}
	idx := uint16(i)
	r.combinations[idx] = hosts
	return idx
}

// getIdForHost returns the ID used in combinations for the host
func (r *Radix) getIdForHost(host string) uint8 {
	for id, h := range r.idToHost {
		if h == host {
			return id
		}
	}

	panic("no ID found for host " + host)
}

// upsertKey inserts a leaf into the radix tree WITHOUT locking the mutex
func (r *Radix) upsertKey(key, host string, overrideTombstone bool) {
	isKeyTombstone := strings.HasSuffix(key, tombstoneSuffix)
	hostID := r.getIdForHost(host)

	// if another host is telling us us to mark this host as having the CID, but we have a tombstone, ignore it - they need to remove the tombstone to tell us that the host has the CID again
	if !isKeyTombstone {
		tombstonesIdx, ok := r.tree.Get([]byte(key + tombstoneSuffix))
		if ok {
			tombstoneHostIDs := r.combinations[tombstonesIdx]
			if slices.Contains(tombstoneHostIDs, hostID) {
				if overrideTombstone {
					r.removeHostFromLeaf(key+tombstoneSuffix, host)
				} else {
					return
				}
			}
		}
	}

	idxOfCurrHostsWithCID, treeHasCID := r.tree.Get([]byte(key))
	var hostsWithCID []uint8
	if treeHasCID {
		hostsWithCID = slices.Clone(r.combinations[idxOfCurrHostsWithCID])
		if !slices.Contains(hostsWithCID, hostID) {
			hostsWithCID = append(hostsWithCID, hostID)
			if host == r.myHost && !strings.HasSuffix(key, tombstoneSuffix) {
				r.NumCIDsOnMyHost++
			}
		}
	} else {
		hostsWithCID = []uint8{hostID}
		if !strings.HasSuffix(key, tombstoneSuffix) {
			r.NumCIDsTotal++
			if host == r.myHost {
				r.NumCIDsOnMyHost++
			}
		}
	}

	// set leaf for the CID to mark the index of the slice of hosts that have the CID
	idxOfNewHostsWithCID := r.getOrMakeCombinationsIdx(hostsWithCID)
	r.tree, _, _ = r.tree.Insert([]byte(key), idxOfNewHostsWithCID)
}

// removeHostFromLeaf removes a host from a leaf in the radix tree WITHOUT locking the mutex
func (r *Radix) removeHostFromLeaf(key, host string) {
	isKeyTombstone := strings.HasSuffix(key, tombstoneSuffix)
	hostID := r.getIdForHost(host)
	idxOfCurrHostsWithCID, treeHasCID := r.tree.Get([]byte(key))
	if !treeHasCID {
		// tree doesn't have CID - there's nothing to do except insert a tombstone
		if !isKeyTombstone {
			r.upsertKey(key+tombstoneSuffix, host, false)
		}
		return
	}

	// remove hostID from slice of hosts that have this CID
	hostsWithCID := []uint8{}
	for _, hostIDWithCID := range r.combinations[idxOfCurrHostsWithCID] {
		if hostIDWithCID != hostID {
			hostsWithCID = append(hostsWithCID, hostIDWithCID)
		}
	}
	if host == r.myHost && len(hostsWithCID) < len(r.combinations[idxOfCurrHostsWithCID]) && !strings.HasSuffix(key, tombstoneSuffix) {
		r.NumCIDsOnMyHost--
	}

	// set leaf for the CID to mark the index of the slice of hosts that now have the CID after removing 'host' (0 if none)
	idxOfNewHostsWithCID := r.getOrMakeCombinationsIdx(hostsWithCID)
	r.tree, _, _ = r.tree.Insert([]byte(key), idxOfNewHostsWithCID)

	// add a tombstone to the tree to mark that this host doesn't have the CID
	if !isKeyTombstone {
		r.upsertKey(key+tombstoneSuffix, host, false)
	}
}

// compressCID returns a shortened key to save memory since many CIDs have commonalities.
func compressCID(cid string) (key string) {
	// all storage v2 CIDs (aka CIDV1) currently start with "baeaaaiqse"
	if strings.HasPrefix(cid, baPrefix) {
		key = baCompressedChar + cid[len(baPrefix):]
		return
	}

	// many suffixes can be compressed and changed to a prefix since we're using a prefix tree
	for suffix, compressedChar := range suffixCompressedChars {
		if strings.HasSuffix(cid, suffix) {
			key = compressedChar + cid[:len(cid)-len(suffix)]
			return
		}
	}

	// no compressions were made
	key = cid
	return
}

// decompressKey undoes replacements from compressCID().
func decompressKey(key string) (cid string) {
	if strings.HasPrefix(key, string(baCompressedChar)) {
		cid = baPrefix + key[len(baCompressedChar):]
		return
	}

	for suffix, compressedChar := range suffixCompressedChars {
		if strings.HasPrefix(key, compressedChar) {
			cid = key[len(compressedChar):] + suffix
			return
		}
	}

	// no decompressions were made
	cid = key
	return
}

// areSetsEqual returns true if a and b contain the same elements in any order, ignoring duplicates.
func areSetsEqual[E comparable](a, b []E) bool {
	if len(a) != len(b) {
		return false
	}

	seen := make(map[E]bool, len(a))
	for _, val := range a {
		seen[val] = true
	}

	for _, val := range b {
		if !seen[val] {
			return false
		}
	}

	return true
}
