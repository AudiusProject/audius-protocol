package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"golang.org/x/exp/slog"

	"mediorum/ethcontracts"
	"mediorum/server/signature"
)

// Constants
const DelistStatusPollingInterval = 20 * time.Second
const HTTPTimeout = 5 * time.Minute
const DelistBatchSize = 5000

type (
	TrackDelistStatus struct {
		CreatedAt time.Time `json:"createdAt"`
		TrackID   int       `json:"trackId"`
		OwnerID   int       `json:"ownerId"`
		TrackCID  string    `json:"trackCid"`
		Delisted  bool      `json:"delisted"`
		Reason    string    `json:"reason"`
	}

	UserDelistStatus struct {
		CreatedAt time.Time `json:"createdAt"`
		UserID    int       `json:"userId"`
		Delisted  bool      `json:"delisted"`
		Reason    string    `json:"reason"`
	}
)

func (ss *MediorumServer) startPollingDelistStatuses() {
	// Read trusted notifier endpoint and wallet from chain
	trustedNotifierID := ss.Config.TrustedNotifierID
	if trustedNotifierID == 0 {
		slog.Warn("trusted notifier id not set, not polling delist statuses")
		return
	}
	trustedNotifier, err := ethcontracts.GetNotifierForID(strconv.Itoa(trustedNotifierID))
	if err != nil {
		slog.Error("failed to get trusted notifier, not polling delist statuses", err)
		return
	}
	slog.Info("got trusted notifier", "endpoint", trustedNotifier.Endpoint, "wallet", trustedNotifier.Wallet)

	// Poll trusted notifier endpoint for delist statuses periodically. We only care about tracks for now.
	ticker := time.NewTicker(DelistStatusPollingInterval)
	for {
		<-ticker.C

		startedAt := time.Now()
		err := ss.pollDelistStatuses("tracks", trustedNotifier.Endpoint, trustedNotifier.Wallet)
		if err == nil {
			slog.Info("finished polling track delist statuses", "took", time.Since(startedAt))
		} else {
			slog.Warn("polling track delist statuses failed", "err", err, "took", time.Since(startedAt))
		}
	}
}

func (ss *MediorumServer) pollDelistStatuses(tracksOrUsers, endpoint, wallet string) error {
	ctx := context.Background()

	var cursorBefore time.Time
	ss.pgPool.QueryRow(ctx, `SELECT created_at FROM delist_status_cursor WHERE host = $1 AND type = $2`, endpoint, tracksOrUsers).Scan(&cursorBefore)

	pollMoreEndpoint := fmt.Sprintf("%s/statuses/%s?cursor=%s&batchSize=%d", endpoint, tracksOrUsers, url.QueryEscape(cursorBefore.Format(time.RFC3339Nano)), DelistBatchSize)
	req, err := signature.SignedGet(pollMoreEndpoint, ss.Config.privateKey)
	if err != nil {
		return err
	}

	client := http.Client{Timeout: HTTPTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		slog.Warn("error fetching from trusted notifier", "status", resp.StatusCode)
		return errors.New(resp.Status)
	}

	if tracksOrUsers == "users" {
		return ss.processUserDelistStatuses(resp.Body, ctx, endpoint)
	}
	return ss.processTrackDelistStatuses(resp.Body, ctx, endpoint)
}

func (ss *MediorumServer) processTrackDelistStatuses(body io.ReadCloser, ctx context.Context, endpoint string) error {
	type TrackDelistStatusesResponse struct {
		Result struct {
			Tracks []TrackDelistStatus `json:"tracks"`
		} `json:"result"`
		Timestamp string `json:"timestamp"`
		Signature string `json:"signature"`
	}

	respBody, err := io.ReadAll(body)
	if err != nil {
		return err
	}

	var delistStatusesResponse TrackDelistStatusesResponse
	if err = json.Unmarshal(respBody, &delistStatusesResponse); err != nil {
		return err
	}

	// Insert fetched rows in local table and update cursor for remote db with the createdAt timestamp of the latest track we have
	if len(delistStatusesResponse.Result.Tracks) > 0 {
		if err = ss.insertTrackDelistStatuses(ctx, delistStatusesResponse.Result.Tracks); err != nil {
			return err
		}

		cursorAfter := delistStatusesResponse.Result.Tracks[len(delistStatusesResponse.Result.Tracks)-1].CreatedAt
		_, err = ss.pgPool.Exec(
			ctx,
			`
			INSERT INTO delist_status_cursor 
			(created_at, host, tracks_or_users) 
			VALUES ($1, $2, $3)
			ON CONFLICT (host, tracks_or_users) 
			DO UPDATE SET 
				created_at = EXCLUDED.created_at
			`,
			cursorAfter, endpoint, "tracks",
		)
	}
	return err
}

func (ss *MediorumServer) insertTrackDelistStatuses(ctx context.Context, tracks []TrackDelistStatus) error {
	tx, err := ss.pgPool.Begin(ctx)
	if err != nil {
		return err
	}

	for _, track := range tracks {
		_, err = tx.Exec(ctx, `INSERT INTO track_delist_statuses ("createdAt", "trackId", "ownerId", "trackCid", "delisted", "reason") VALUES ($1, $2, $3, $4, $5, $6)`,
			track.CreatedAt, track.TrackID, track.OwnerID, track.TrackCID, track.Delisted, track.Reason)
		if err != nil {
			tx.Rollback(ctx)
			return err
		}
	}

	if err = tx.Commit(ctx); err != nil {
		tx.Rollback(ctx)
		return err
	}
	return nil
}

func (ss *MediorumServer) processUserDelistStatuses(body io.ReadCloser, ctx context.Context, endpoint string) error {
	type UserDelistStatusesResponse struct {
		Result struct {
			Users []UserDelistStatus `json:"users"`
		} `json:"result"`
		Timestamp string `json:"timestamp"`
		Signature string `json:"signature"`
	}

	respBody, err := io.ReadAll(body)
	if err != nil {
		return err
	}

	var delistStatusesResponse UserDelistStatusesResponse
	if err = json.Unmarshal(respBody, &delistStatusesResponse); err != nil {
		return err
	}

	// Insert fetched rows in local table and update cursor for remote db with the createdAt timestamp of the latest user we have
	if len(delistStatusesResponse.Result.Users) > 0 {
		if err = ss.insertUserDelistStatuses(ctx, delistStatusesResponse.Result.Users); err != nil {
			return err
		}

		cursorAfter := delistStatusesResponse.Result.Users[len(delistStatusesResponse.Result.Users)-1].CreatedAt
		_, err = ss.pgPool.Exec(
			ctx,
			`
			INSERT INTO delist_status_cursor 
			(created_at, host, tracks_or_users) 
			VALUES ($1, $2, $3)
			ON CONFLICT (host, tracks_or_users) 
			DO UPDATE SET 
				created_at = EXCLUDED.created_at
			`,
			cursorAfter, endpoint, "users",
		)
	}
	return err
}

func (ss *MediorumServer) insertUserDelistStatuses(ctx context.Context, users []UserDelistStatus) error {
	tx, err := ss.pgPool.Begin(ctx)
	if err != nil {
		return err
	}

	for _, user := range users {
		_, err = tx.Exec(ctx, `INSERT INTO user_delist_statuses ("createdAt", "userId", "delisted", "reason") VALUES ($1, $2, $3, $4)`,
			user.CreatedAt, user.UserID, user.Delisted, user.Reason)
		if err != nil {
			tx.Rollback(ctx)
			return err
		}
	}

	if err = tx.Commit(ctx); err != nil {
		tx.Rollback(ctx)
		return err
	}
	return nil
}
