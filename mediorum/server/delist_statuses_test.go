package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

type MockedDelistResponse struct {
	Result struct {
		Tracks []jsonDelistStatus `json:"tracks"`
		Users  []jsonDelistStatus `json:"users"`
	} `json:"result"`
	Timestamp string `json:"timestamp"`
	Signature string `json:"signature"`
}

func TestPollDelistStatuses(t *testing.T) {
	ss := testNetwork[0]

	// Double-check we're in test mode before truncating tables
	assert.Equal(t, "test", ss.Config.Env)

	mockResponse := MockedDelistResponse{
		Result: struct {
			Tracks []jsonDelistStatus `json:"tracks"`
			Users  []jsonDelistStatus `json:"users"`
		}{
			Tracks: []jsonDelistStatus{
				{
					CreatedAt: time.Now().Format(TimeFormat),
					aliasDelistStatus: &aliasDelistStatus{
						TrackID:  1,
						OwnerID:  100,
						TrackCID: "trackCid1",
						Delisted: true,
						Reason:   "ACR",
					},
				},
				{
					CreatedAt: time.Now().Format(TimeFormat),
					aliasDelistStatus: &aliasDelistStatus{
						TrackID:  2,
						OwnerID:  100,
						TrackCID: "trackCid2",
						Delisted: true,
						Reason:   "DMCA",
					},
				},
				{
					CreatedAt: time.Now().Add(time.Hour + time.Minute).Format(TimeFormat),
					aliasDelistStatus: &aliasDelistStatus{
						TrackID:  1,
						OwnerID:  100,
						TrackCID: "trackCid1",
						Delisted: false,
						Reason:   "MANUAL",
					},
				},
				{
					CreatedAt: time.Now().Format(TimeFormat),
					aliasDelistStatus: &aliasDelistStatus{
						TrackID:  3,
						OwnerID:  200,
						TrackCID: "trackCid3",
						Delisted: true,
						Reason:   "DMCA",
					},
				},
			},
			Users: []jsonDelistStatus{
				{
					CreatedAt: time.Now().Format(TimeFormat),
					aliasDelistStatus: &aliasDelistStatus{
						UserID:   100,
						Delisted: true,
						Reason:   "STRIKE_THRESHOLD",
					},
				},
				{
					CreatedAt: time.Now().Add(time.Hour + time.Minute).Format(TimeFormat),
					aliasDelistStatus: &aliasDelistStatus{
						UserID:   100,
						Delisted: false,
						Reason:   "COPYRIGHT_SCHOOL",
					},
				},
				{
					CreatedAt: time.Now().Format(TimeFormat),
					aliasDelistStatus: &aliasDelistStatus{
						UserID:   300,
						Delisted: true,
						Reason:   "STRIKE_THRESHOLD",
					},
				},
			},
		},
		Timestamp: time.Now().Format(time.RFC3339Nano),
		Signature: "testSignature",
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(mockResponse)
	}))
	defer server.Close()

	// Nothing should be delisted yet
	assert.False(t, ss.isCidBlacklisted(context.Background(), "trackCid1"))
	assert.False(t, ss.isCidBlacklisted(context.Background(), "trackCid2"))
	assert.False(t, ss.isCidBlacklisted(context.Background(), "trackCid3"))

	// Poll delisted tracks and users
	assert.NoError(t, ss.pollDelistStatuses("tracks", server.URL, "testWallet"))
	assert.NoError(t, ss.pollDelistStatuses("users", server.URL, "testWallet"))

	// Verify that the delist statuses were inserted into the database
	assert.False(t, ss.isCidBlacklisted(context.Background(), "trackCid1"))
	assert.True(t, ss.isCidBlacklisted(context.Background(), "trackCid2"))
	assert.True(t, ss.isCidBlacklisted(context.Background(), "trackCid3"))
}
