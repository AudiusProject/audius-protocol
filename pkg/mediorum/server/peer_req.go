package server

import (
	"fmt"
)

// some servers might not have all uploads if they can't talk directly to each other
// as a last resort use this function to pull an Upload record from a peer
// (used when resolving upload ID -> orig CID for image serving)
func (ss *MediorumServer) peerGetUpload(peerHost string, ulid string) (*Upload, error) {
	var upload *Upload
	resp, err := ss.reqClient.R().
		SetSuccessResult(&upload).
		Get(apiPath(peerHost, "uploads", ulid))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		err := fmt.Errorf("%s: %s %s", resp.Request.RawURL, resp.Status, string(resp.Bytes()))
		return nil, err
	}
	return upload, nil
}
