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

	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/exp/slog"

	"mediorum/server/signature"
)

const (
	DelistStatusPollingInterval              = 20 * time.Second
	HTTPTimeout                              = 5 * time.Minute
	DelistBatchSize                          = 5000
	TimeFormat                               = "2006-01-02 15:04:05.999999-07"
	Tracks                      DelistEntity = "tracks"
	Users                       DelistEntity = "users"
)

type (
	DelistEntity string

	DelistStatus struct {
		CreatedAt time.Time `json:"-"`
		Delisted  bool      `json:"delisted"`
		Reason    string    `json:"reason"`

		// fields specific to TrackDelistStatus
		TrackID  int    `json:"trackId,omitempty"`
		TrackCID string `json:"trackCid,omitempty"`
		OwnerID  int    `json:"ownerId,omitempty"`

		// field specific to UserDelistStatus
		UserID int `json:"userId,omitempty"`
	}

	aliasDelistStatus DelistStatus

	jsonDelistStatus struct {
		*aliasDelistStatus
		CreatedAt string `json:"createdAt"`
	}
)

func (ds *DelistStatus) UnmarshalJSON(data []byte) error {
	temp := &jsonDelistStatus{
		aliasDelistStatus: (*aliasDelistStatus)(ds),
	}
	if err := json.Unmarshal(data, &temp); err != nil {
		return err
	}
	var err error
	ds.CreatedAt, err = time.Parse(TimeFormat, temp.CreatedAt)
	if err != nil {
		ds.CreatedAt = time.Now()
	}
	return nil
}

func (ss *MediorumServer) serveTrackDelistStatus(c echo.Context) error {
	ctx := c.Request().Context()

	sql := `SELECT *
		FROM "track_delist_statuses"
		WHERE "trackCid" = $1
		ORDER BY "createdAt" DESC
		LIMIT 1`
	row := ss.pgPool.QueryRow(ctx, sql, c.Param("trackCid"))
	var createdAt time.Time
	var trackId, ownerId int
	var trackCid string
	var delisted bool
	var reason string

	err := row.Scan(&createdAt, &trackId, &ownerId, &trackCid, &delisted, &reason)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.String(http.StatusNotFound, "No records found. This means there's no delist status and the track is not delisted.")
		} else {
			return c.String(500, fmt.Sprintf("Failed to get delist status: %v", err))
		}
	}
	return c.JSON(200, map[string]interface{}{"createdAt": createdAt, "delisted": delisted, "reason": reason, "trackId": trackId, "ownerId": ownerId, "trackCid": trackCid})
}

func (ss *MediorumServer) serveUserDelistStatus(c echo.Context) error {
	ctx := c.Request().Context()

	sql := `SELECT *
		FROM "user_delist_statuses"
		WHERE "userId" = $1
		ORDER BY "createdAt" DESC
		LIMIT 1`
	row := ss.pgPool.QueryRow(ctx, sql, c.Param("userId"))
	var createdAt time.Time
	var userId int
	var delisted bool
	var reason string

	err := row.Scan(&createdAt, &userId, &delisted, &reason)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.String(http.StatusNotFound, "No records found. This means there's no delist status and the user is not delisted.")
		} else {
			return c.String(500, fmt.Sprintf("Failed to get delist status: %v", err))
		}
	}
	return c.JSON(200, map[string]interface{}{"createdAt": createdAt, "delisted": delisted, "reason": reason, "userId": userId})
}

func (ss *MediorumServer) serveInsertDelistStatus(c echo.Context) error {
	ctx := c.Request().Context()
	var ds DelistStatus

	err := c.Bind(ds)
	if err != nil {
		return c.String(400, fmt.Sprintf("Invalid body: %v", err))
	}

	if ds.TrackCID != "" && ds.TrackID != 0 && ds.OwnerID != 0 {
		_, err = ss.pgPool.Exec(ctx, `INSERT INTO track_delist_statuses ("createdAt", "trackId", "ownerId", "trackCid", delisted, reason) VALUES ($1, $2, $3, $4, $5, $6)`,
			time.Now(), ds.TrackID, ds.OwnerID, ds.TrackCID, ds.Delisted, "MANUAL")
	} else if ds.UserID != 0 {
		_, err = ss.pgPool.Exec(ctx, `INSERT INTO user_delist_statuses ("createdAt", "userId", delisted, reason) VALUES ($1, $2, $3, $4)`,
			time.Now(), ds.UserID, ds.Delisted, "MANUAL")
	} else {
		return c.String(http.StatusBadRequest, "Invalid entity type")
	}

	if err != nil {
		return c.String(500, fmt.Sprintf("Failed to create delist status: %v", err))
	}

	return c.JSON(http.StatusCreated, ds)
}

func (ss *MediorumServer) startPollingDelistStatuses() {
	if ss.trustedNotifier.Endpoint == "" {
		slog.Warn("trusted notifier not properly setup, not polling delist statuses")
		return
	}

	ticker := time.NewTicker(DelistStatusPollingInterval)
	for {
		<-ticker.C

		for _, entity := range []DelistEntity{Tracks, Users} {
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

func (ss *MediorumServer) pollDelistStatuses(entity DelistEntity, endpoint, wallet string) error {
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

	return ss.processDelistStatuses(resp.Body, ctx, endpoint, entity)
}

func (ss *MediorumServer) processDelistStatuses(body io.ReadCloser, ctx context.Context, endpoint string, entity DelistEntity) error {
	type DelistStatusesResponse struct {
		Result    json.RawMessage `json:"result"`
		Timestamp string          `json:"timestamp"`
		Signature string          `json:"signature"`
	}

	// TODO: We should be actually verifying the signature here

	respBody, err := io.ReadAll(body)
	if err != nil {
		return err
	}

	var delistStatusesResponse DelistStatusesResponse
	if err = json.Unmarshal(respBody, &delistStatusesResponse); err != nil {
		return err
	}

	var delistStatuses struct {
		Entities []DelistStatus `json:""`
	}
	delistStatuses.Entities = []DelistStatus{}

	// unmarshal based on entity type (tracks or users)
	if entity == "tracks" {
		err = json.Unmarshal(delistStatusesResponse.Result, &struct {
			Entities *[]DelistStatus `json:"tracks"`
		}{Entities: &delistStatuses.Entities})
	} else if entity == "users" {
		err = json.Unmarshal(delistStatusesResponse.Result, &struct {
			Entities *[]DelistStatus `json:"users"`
		}{Entities: &delistStatuses.Entities})
	}

	if err != nil {
		return err
	}

	// insert fetched rows in local table and update cursor for remote db with the createdAt timestamp of the latest entity we have
	if len(delistStatuses.Entities) > 0 {
		if err = ss.insertDelistStatuses(ctx, delistStatuses.Entities, entity); err != nil {
			return err
		}

		cursorAfter := delistStatuses.Entities[len(delistStatuses.Entities)-1].CreatedAt
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
			cursorAfter, endpoint, entity,
		)
	}
	return err
}

func (ss *MediorumServer) insertDelistStatuses(ctx context.Context, dss []DelistStatus, entity DelistEntity) error {
	tx, err := ss.pgPool.Begin(ctx)
	if err != nil {
		return err
	}

	for _, ds := range dss {
		if entity == "tracks" {
			_, err = tx.Exec(ctx, `INSERT INTO track_delist_statuses ("createdAt", "trackId", "ownerId", "trackCid", "delisted", "reason") VALUES ($1, $2, $3, $4, $5, $6)`,
				ds.CreatedAt, ds.TrackID, ds.OwnerID, ds.TrackCID, ds.Delisted, ds.Reason)
		} else if entity == "users" {
			_, err = tx.Exec(ctx, `INSERT INTO user_delist_statuses ("createdAt", "userId", "delisted", "reason") VALUES ($1, $2, $3, $4)`,
				ds.CreatedAt, ds.UserID, ds.Delisted, ds.Reason)
		}
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
