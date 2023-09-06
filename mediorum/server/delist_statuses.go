package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"golang.org/x/exp/slog"

	"mediorum/server/signature"
)

// Constants
const (
	DelistStatusPollingInterval = 20 * time.Second
	HTTPTimeout                 = 5 * time.Minute
	DelistBatchSize             = 5000
	TimeFormat                  = "2006-01-02 15:04:05.999999-07"
)

type (
	TrackDelistStatus struct {
		CreatedAt time.Time `json:"-"`
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

	// Types to avoid infinite recursion when calling json.Unmarshal
	aliasTrackDelistStatus TrackDelistStatus
	aliasUserDelistStatus  UserDelistStatus

	// Types to unmarshal timestamps in the format returned by the trusted notifier
	jsonTrackDelistStatus struct {
		*aliasTrackDelistStatus
		CreatedAt string `json:"createdAt"`
	}
	jsonUserDelistStatus struct {
		*aliasUserDelistStatus
		CreatedAt string `json:"createdAt"`
	}
)

func (t *TrackDelistStatus) UnmarshalJSON(data []byte) error {
	temp := &jsonTrackDelistStatus{
		aliasTrackDelistStatus: (*aliasTrackDelistStatus)(t),
	}
	if err := json.Unmarshal(data, &temp); err != nil {
		return err
	}
	var err error
	t.CreatedAt, err = time.Parse(TimeFormat, temp.CreatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (u *UserDelistStatus) UnmarshalJSON(data []byte) error {
	temp := &jsonUserDelistStatus{
		aliasUserDelistStatus: (*aliasUserDelistStatus)(u),
	}
	if err := json.Unmarshal(data, &temp); err != nil {
		return err
	}
	var err error
	u.CreatedAt, err = time.Parse(TimeFormat, temp.CreatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (ss *MediorumServer) startPollingDelistStatuses() {
	if ss.trustedNotifier.Endpoint == "" {
		slog.Warn("trusted notifier not properly setup, not polling delist statuses")
		return
	}

	ticker := time.NewTicker(DelistStatusPollingInterval)
	for {
		<-ticker.C

		for _, entity := range []string{"tracks", "users"} {
			startedAt := time.Now()
			err := ss.pollDelistStatuses(entity, ss.trustedNotifier.Endpoint, ss.trustedNotifier.Wallet)
			pollingMsg := fmt.Sprintf("finished polling delist statuses for %s", entity)
			if err == nil {
				slog.Info(pollingMsg, "took", time.Since(startedAt))
			} else {
				slog.Warn(pollingMsg, "err", err, "took", time.Since(startedAt))
			}
		}
	}
}

func (ss *MediorumServer) pollDelistStatuses(entity, endpoint, wallet string) error {
	ctx := context.Background()

	var cursorBefore time.Time
	ss.pgPool.QueryRow(ctx, `SELECT created_at FROM delist_status_cursor WHERE host = $1 AND entity = $2`, endpoint, entity).Scan(&cursorBefore)

	pollMoreEndpoint := fmt.Sprintf("%s/statuses/%s?cursor=%s&batchSize=%d", endpoint, entity, url.QueryEscape(cursorBefore.Format(time.RFC3339Nano)), DelistBatchSize)
	req, err := signature.SignedGet(pollMoreEndpoint, ss.Config.privateKey, ss.Config.Self.Host)
	if err != nil {
		return err
	}

	client := http.Client{Timeout: HTTPTimeout}
	req.Header.Set("User-Agent", "mediorum "+ss.Config.Self.Host)
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		slog.Warn("error fetching from trusted notifier", "status", resp.StatusCode, "endpoint", pollMoreEndpoint)
		return errors.New(resp.Status)
	}

	if entity == "users" {
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
			(created_at, host, entity)
			VALUES ($1, $2, $3)
			ON CONFLICT (host, entity)
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
			(created_at, host, entity)
			VALUES ($1, $2, $3)
			ON CONFLICT (host, entity)
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

func (ss *MediorumServer) isCidBlacklisted(ctx context.Context, cid string) bool {
	blacklisted := false
	sql := `SELECT COALESCE(
	                (SELECT "delisted"
	                 FROM "track_delist_statuses"
	                 WHERE "trackCid" = $1
	                 ORDER BY "createdAt" DESC
	                 LIMIT 1),
	            false)`
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&blacklisted)
	if err != nil {
		ss.logger.Error("isCidBlacklisted error", "err", err, "cid", cid)
	}
	return blacklisted
}
