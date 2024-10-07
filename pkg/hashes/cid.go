package hashes

import (
	"io"

	"github.com/ipfs/go-cid"
	"github.com/multiformats/go-multihash"
)

// copy pasted from
// https://github.com/AudiusProject/audius-protocol/blob/main/mediorum/cidutil/cidutil.go#L39
//
// sadly we did not set up the cid builder correctly
// so our cids use 0x00 (raw identity) instead of 0x12 (SHA2_256)
// (see: https://github.com/multiformats/multihash)
//
// we could fix this in the future, but we'll always have "0x00" cids around
func ComputeFileCID(f io.ReadSeeker) (string, error) {
	defer f.Seek(0, 0)

	hash, err := multihash.SumStream(f, multihash.SHA2_256, -1)
	if err != nil {
		return "", err
	}

	// should be:
	// cid := cid.NewCidV1(0x12, hash)

	// but is:
	builder := cid.V1Builder{}
	cid, err := builder.Sum(hash)
	if err != nil {
		return "", err
	}
	return cid.String(), nil
}
