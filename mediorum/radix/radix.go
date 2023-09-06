package radix

// TODO: if the set of registered nodes changes then we need to wipe everything

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

	myHost            string
	tree              *iradix.Tree[uint16]
	mu                sync.RWMutex
	idToHost          map[uint8]string   // ints representing a node (to save space so we don't have to store the full host string)
	combinations      map[uint16][]uint8 // ints representing a set/combination of nodes that have a CID (to store at radix leaves). 0 is reserved for "no hosts have this CID"
	otherHostSuffixes map[string]string  // each host to the suffix we append to each key in our tree so we know it came from that host
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
		tree:              iradix.New[uint16](),
		myHost:            myHost,
		idToHost:          make(map[uint8]string, len(otherHosts)),
		otherHostSuffixes: make(map[string]string, len(otherHosts)),
		combinations:      make(map[uint16][]uint8, 65535),
	}

	r.idToHost[0] = myHost
	for i, otherHost := range otherHosts {
		r.otherHostSuffixes[otherHost] = fmt.Sprintf("_%d", i)
		r.idToHost[uint8(i+1)] = otherHost
	}

	return
}

// GetHostsWithCID returns the hosts that we confirmed to have the given CID.
// NOTE: This is only this host's view, which is only accurate for CIDs for which this host is in the top rendezvous. You will need to aggregate with other host' radix views to get a complete picture using GetOtherViewsOfHostsWithCID().
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

// GetOtherViewsOfHostsWithCID returns a mapping of each other host to the other host's view of which hosts have the given CID.
func (r *Radix) GetOtherViewsOfHostsWithCID(cid string) map[string][]string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	key := compressCID(cid)

	otherHostViews := make(map[string][]string, len(r.otherHostSuffixes))
	for otherHost, suffix := range r.otherHostSuffixes {
		if idx, ok := r.tree.Get([]byte(key + suffix)); ok {
			hostsWithCID := r.combinations[idx]
			for _, idOfHostWithCID := range hostsWithCID {
				otherHostViews[otherHost] = append(otherHostViews[otherHost], r.idToHost[idOfHostWithCID])
			}
		}
	}

	return otherHostViews
}

// SetHostHasCID should only be called after checking a host and confirming it has the given CID.
func (r *Radix) SetHostHasCID(host, cid string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := compressCID(cid)
	hostID := r.getIdForHost(host)

	idxOfCurrHostsWithCID, treeHasCID := r.tree.Get([]byte(key))
	var hostsWithCID []uint8
	if treeHasCID {
		hostsWithCID = slices.Clone(r.combinations[idxOfCurrHostsWithCID])
		if !slices.Contains(hostsWithCID, hostID) {
			hostsWithCID = append(hostsWithCID, hostID)
			if host == r.myHost {
				r.NumCIDsOnMyHost++
			}
		}
	} else {
		hostsWithCID = []uint8{hostID}
		r.NumCIDsTotal++
		if host == r.myHost {
			r.NumCIDsOnMyHost++
		}
	}

	// set leaf for the CID to mark the index of the slice of hosts that have the CID
	idxOfNewHostsWithCID := r.getOrMakeCombinationsIdx(hostsWithCID)
	r.tree, _, _ = r.tree.Insert([]byte(key), idxOfNewHostsWithCID)
}

// SetHostNotHasCID marks the given CID as not existing on the given host.
func (r *Radix) SetHostNotHasCID(host, cid string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := compressCID(cid)
	hostID := r.getIdForHost(host)

	idxOfCurrHostsWithCID, treeHasCID := r.tree.Get([]byte(key))
	if !treeHasCID {
		return
	}

	// remove hostID from slice of hosts that have this CID
	hostsWithCID := []uint8{}
	for _, hostIDWithCID := range r.combinations[idxOfCurrHostsWithCID] {
		if hostIDWithCID != hostID {
			hostsWithCID = append(hostsWithCID, hostIDWithCID)
		}
	}
	if host == r.myHost && len(hostsWithCID) < len(r.combinations[idxOfCurrHostsWithCID]) {
		r.NumCIDsOnMyHost--
	}

	// set leaf for the CID to mark the index of the slice of hosts that now have the CID
	if len(hostsWithCID) == 0 {
		r.tree, _, _ = r.tree.Delete([]byte(key))
	} else {
		idxOfNewHostsWithCID := r.getOrMakeCombinationsIdx(hostsWithCID)
		r.tree, _, _ = r.tree.Insert([]byte(key), idxOfNewHostsWithCID)
	}
}

type ServeCIDInfoResp struct {
	HostViews map[string][]string // map of host to which hosts they think have the CID
}

func (r *Radix) ServeCIDInfo(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	cid := c.Param("cid")
	hostViews := r.GetOtherViewsOfHostsWithCID(cid)
	hostViews[r.myHost] = r.GetHostsWithCID(cid)

	return c.JSON(http.StatusOK, ServeCIDInfoResp{HostViews: hostViews})
}

const maxPageSize = 100000

type ServeTreeInternalResp struct {
	IdToHost     map[uint8]string
	Combinations map[uint16][]uint8
	Leaves       map[string]uint16
	LastKey      string
}

// ServeTreePaginatedInternal returns a paginated list of tree leaves for other Content Nodes to use.
// TODO: We should add delta tracking to reduce bandwidth usage: keep the previous tree for a week and only send the differences unless the other node requests the entire tree for the first time.
func (r *Radix) ServeTreePaginatedInternal(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	greaterThanKey := c.QueryParam("greaterThanKey")
	pageSize, err := strconv.Atoi(c.QueryParam("pageSize"))
	if err != nil || pageSize > maxPageSize {
		pageSize = maxPageSize
	}

	iter := r.tree.Root().Iterator()
	if greaterThanKey != "" {
		iter.SeekLowerBound([]byte(greaterThanKey))
		iter.Next() // skip the greaterThanKey itself
	}

	resp := ServeTreeInternalResp{
		Leaves:       make(map[string]uint16, pageSize),
		IdToHost:     map[uint8]string{},
		Combinations: map[uint16][]uint8{},
	}
	var lastKey string
	for key, val, ok := iter.Next(); ok && len(resp.Leaves) < pageSize; key, val, ok = iter.Next() {
		keyStr := string(key)

		// only share our own leaves - not leaves that are tracking other hosts
		if strings.Contains(keyStr, "_") {
			continue
		}

		lastKey = keyStr
		resp.Leaves[keyStr] = val

		// share our mappings so the other host can re-map them to their own IDs
		if !slices.Contains(maps.Keys(resp.Combinations), val) {
			resp.Combinations[val] = r.combinations[val]
			for _, hostID := range r.combinations[val] {
				resp.IdToHost[hostID] = r.idToHost[hostID]
			}
		}
	}

	resp.LastKey = lastKey
	return c.JSON(http.StatusOK, resp)
}

type ServeTreeCIDResp struct {
	ReportedByHost string
	HostsWithCID   []string
}
type ServeTreeResp struct {
	CIDs map[string]ServeTreeCIDResp
}

// ServeTreePaginated returns a paginated list of tree leaves in human-readable format.
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
		CIDs: make(map[string]ServeTreeCIDResp, pageSize),
	}
	for key, val, ok := iter.Next(); ok && len(resp.CIDs) < pageSize; key, val, ok = iter.Next() {
		keyStr := string(key)

		host := r.myHost
		if strings.Contains(keyStr, "_") {
			// this is a leaf that's tracking another host's view
			split := strings.Split(keyStr, "_")
			keyStr = split[0]
			suffix := "_" + split[1]

			for otherHost, otherSuffix := range r.otherHostSuffixes {
				if otherSuffix == suffix {
					host = otherHost
					break
				}
			}

			if host == r.myHost {
				// we couldn't find the host that this leaf is tracking - this should never happen
				continue
			}
		}

		hostIDsWithCID := r.combinations[val]
		hostsWithCID := make([]string, 0, len(hostIDsWithCID))
		for _, hostID := range hostIDsWithCID {
			hostsWithCID = append(hostsWithCID, r.idToHost[hostID])
		}

		resp.CIDs[decompressKey(keyStr)] = ServeTreeCIDResp{
			ReportedByHost: host,
			HostsWithCID:   hostsWithCID,
		}
	}

	return c.JSON(http.StatusOK, resp)
}

type ServeReplicationCountsResp struct {
	NumHostsStoringNumCIDs    map[string]map[int]int
	NumHostsStoringNumCIDsAgg map[int]int
}

// ServeReplicationCounts returns a mapping of number to the number of CIDs that are replicated by that many hosts.
func (r *Radix) ServeReplicationCounts(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	iter := r.tree.Root().Iterator()

	resp := ServeReplicationCountsResp{
		NumHostsStoringNumCIDs:    make(map[string]map[int]int, len(r.otherHostSuffixes)+1),
		NumHostsStoringNumCIDsAgg: map[int]int{},
	}
	resp.NumHostsStoringNumCIDs[r.myHost] = make(map[int]int)
	for otherHost := range r.otherHostSuffixes {
		resp.NumHostsStoringNumCIDs[otherHost] = make(map[int]int)
	}

	for key, val, ok := iter.Next(); ok; key, val, ok = iter.Next() {
		keyStr := string(key)

		if strings.Contains(keyStr, "_") {
			// this is a leaf that's tracking another host's view
			continue
		}

		// count num unique hosts that have this CID, as confirmed by us (myHost)
		hostsWithCID := r.combinations[val]
		resp.NumHostsStoringNumCIDs[r.myHost][len(hostsWithCID)]++

		// count num unique hosts that have this CID, as confirmed by all other hosts
		for otherHost, suffix := range r.otherHostSuffixes {
			if idx, ok := r.tree.Get([]byte(keyStr + suffix)); ok {
				hostsWithCIDInOtherHostView := r.combinations[idx]
				resp.NumHostsStoringNumCIDs[otherHost][len(hostsWithCIDInOtherHostView)]++

				// aggregate unique hosts storing CID
				for _, hostID := range hostsWithCIDInOtherHostView {
					if !slices.Contains(hostsWithCID, hostID) {
						hostsWithCID = append(hostsWithCID, hostID)
					}
				}
			}
		}

		// count aggregated unique hosts that have this CID in the view of all hosts
		resp.NumHostsStoringNumCIDsAgg[len(hostsWithCID)]++
	}

	return c.JSON(http.StatusOK, resp)
}

type ServeReplicationCIDs struct {
	ReplicationFactor int
	CIDs              []string
}

// ServeReplicationCIDsPaginated return the CIDs that are replicated by the given number of hosts.
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

		if strings.Contains(keyStr, "_") {
			// this is a leaf that's tracking another host's view
			continue
		}

		// aggregate unique hosts storing CID confirmed by this host (our view) and other host views
		hostsWithCID := r.combinations[val]
		for _, suffix := range r.otherHostSuffixes {
			if idx, ok := r.tree.Get([]byte(keyStr + suffix)); ok {
				hostsWithCIDInOtherHostView := r.combinations[idx]

				// aggregate unique hosts storing CID
				for _, hostID := range hostsWithCIDInOtherHostView {
					if !slices.Contains(hostsWithCID, hostID) {
						hostsWithCID = append(hostsWithCID, hostID)
					}
				}
			}
		}

		if replicationFactor == len(hostsWithCID) {
			resp.CIDs = append(resp.CIDs, decompressKey(decompressKey(keyStr)))
		}
	}

	return c.JSON(http.StatusOK, resp)
}

type ServeNumCIDsOnOnlyHostsResp struct {
	Hosts              []string
	NumCIDsOnlyOnHosts int
}

// ServeNumCIDsOnOnlyHosts returns the number of CIDs that are only on the given hosts.
func (r *Radix) ServeNumCIDsOnOnlyHosts(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	onlyOnHostsStr := c.Param("hosts")
	onlyOnHosts := strings.Split(onlyOnHostsStr, ",")
	if len(onlyOnHosts) == 0 {
		return c.JSON(http.StatusBadRequest, "no hosts specified")
	}
	for _, host := range onlyOnHosts {
		if _, ok := r.otherHostSuffixes[host]; !ok && host != r.myHost {
			return c.JSON(http.StatusBadRequest, fmt.Sprintf("host %s not found", host))
		}
	}

	iter := r.tree.Root().Iterator()

	resp := ServeNumCIDsOnOnlyHostsResp{
		Hosts: onlyOnHosts,
	}

	for key, val, ok := iter.Next(); ok; key, val, ok = iter.Next() {
		keyStr := string(key)

		if strings.Contains(keyStr, "_") {
			// this is a leaf that's tracking another host's view
			continue
		}

		// find all hosts that have this CID
		hostsWithCID := r.combinations[val]
		for _, suffix := range r.otherHostSuffixes {
			if idx, ok := r.tree.Get([]byte(keyStr + suffix)); ok {
				hostsWithCIDInOtherHostView := r.combinations[idx]
				for _, hostID := range hostsWithCIDInOtherHostView {
					if !slices.Contains(hostsWithCID, hostID) {
						hostsWithCID = append(hostsWithCID, hostID)
					}
				}
			}
		}

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
}

// ServeCIDsOnOnlyHostsPaginated returns the CIDs that are only on the given hosts.
func (r *Radix) ServeCIDsOnOnlyHostsPaginated(c echo.Context) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	onlyOnHostsStr := c.QueryParam("hosts")
	onlyOnHosts := strings.Split(onlyOnHostsStr, ",")
	if len(onlyOnHosts) == 0 {
		return c.JSON(http.StatusBadRequest, "no hosts specified")
	}
	for _, host := range onlyOnHosts {
		if _, ok := r.otherHostSuffixes[host]; !ok && host != r.myHost {
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

		if strings.Contains(keyStr, "_") {
			// this is a leaf that's tracking another host's view
			continue
		}

		// find all hosts that have this CID
		hostsWithCID := r.combinations[val]
		for _, suffix := range r.otherHostSuffixes {
			if idx, ok := r.tree.Get([]byte(keyStr + suffix)); ok {
				hostsWithCIDInOtherHostView := r.combinations[idx]
				for _, hostID := range hostsWithCIDInOtherHostView {
					if !slices.Contains(hostsWithCID, hostID) {
						hostsWithCID = append(hostsWithCID, hostID)
					}
				}
			}
		}

		if len(hostsWithCID) != len(onlyOnHosts) {
			continue
		}
		for _, host := range onlyOnHosts {
			if !slices.Contains(hostsWithCID, r.getIdForHost(host)) {
				continue
			}
		}
		resp.CIDsOnlyOnHosts = append(resp.CIDsOnlyOnHosts, decompressKey(keyStr))
	}

	return c.JSON(http.StatusOK, resp)
}

// InsertOtherHostsView inserts leaves for every CID that otherHost reports having.
func (r *Radix) InsertOtherHostsView(otherHost string, pageSize int) {
	var result ServeTreeInternalResp
	baseURL := fmt.Sprintf("%s/radix/internal/leaves?pageSize=%d", otherHost, pageSize)
	for {
		// build paginated URL
		var nextURL string
		if result.LastKey == "" {
			nextURL = baseURL
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

func (r *Radix) addLeavesFromOtherHost(otherHost string, leaves *map[string]uint16, idToHost *map[uint8]string, combinations *map[uint16][]uint8) {
	r.mu.Lock()
	defer r.mu.Unlock()

	otherHosts := maps.Keys(r.otherHostSuffixes)
	for key, leafValOnOtherHost := range *leaves {
		// re-map the other host's IDs to our own
		idsOnOtherHost := (*combinations)[leafValOnOtherHost]
		hostIDs := make([]uint8, 0, len(idsOnOtherHost))
		for _, idOnOtherHost := range idsOnOtherHost {
			host := (*idToHost)[idOnOtherHost]
			if !slices.Contains(otherHosts, host) && host != r.myHost {
				continue // a new node probably registered that we're not aware of, so we'll ignore it for now
			}
			hostIDs = append(hostIDs, r.getIdForHost(host))
		}

		// re-map host ID combination to our own
		leafVal := r.getOrMakeCombinationsIdx(hostIDs)

		// add suffix to each key so we know it came from otherHost
		otherHostKey := key + r.otherHostSuffixes[otherHost]
		r.tree, _, _ = r.tree.Insert([]byte(otherHostKey), leafVal)

		// we want to be aware of this key, too
		if _, ok := r.tree.Get([]byte(key)); !ok {
			r.NumCIDsTotal++
			r.tree, _, _ = r.tree.Insert([]byte(key), 0)
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
