package crudr

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gorm.io/gorm/clause"
)

func (c *Crudr) NewClient(host, streamEndpoint, bulkEndpoint string) {
	for {
		err := c.newClient(host, streamEndpoint, bulkEndpoint)
		if err != nil {
			c.logger.Warn("sse client died", "host", host, "err", err)
		}
		time.Sleep(time.Second * 5)
	}
}

func (c *Crudr) newClient(host, streamEndpoint, bulkEndpoint string) error {

	logger := c.logger.New("client_of", host)
	logger.Debug("creating client")

	for {
		err := c.clientBackfill(host, bulkEndpoint)
		if err != nil {
			logger.Warn("sweep failed", "err", err)
		}
		time.Sleep(time.Minute)
	}
}

func (c *Crudr) clientBackfill(host, bulkEndpoint string) error {

	// get cursor
	lastUlid := ""
	{
		var cursor Cursor
		err := c.DB.Where("host = ?", host).First(&cursor).Error
		if err != nil {
			c.logger.Info("failed to get cursor", "err", err)
		} else {
			lastUlid = cursor.LastULID
		}
	}

	endpoint := host + bulkEndpoint + "?after=" + lastUlid

	client := &http.Client{
		Timeout: time.Minute,
	}

	resp, err := client.Get(endpoint)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("bad status: %d", resp.StatusCode)
	}

	var ops []*Op
	dec := json.NewDecoder(resp.Body)
	err = dec.Decode(&ops)
	if err != nil {
		return err
	}

	for _, op := range ops {
		err := c.ApplyOp(op)
		if err != nil {
			fmt.Println(err)
		} else {
			lastUlid = op.ULID
		}
	}

	// set cursor
	{
		upsertClause := clause.OnConflict{UpdateAll: true}
		err := c.DB.Clauses(upsertClause).Create(&Cursor{Host: host, LastULID: lastUlid}).Error
		if err != nil {
			c.logger.Info("failed to set cursor", "err", err)
		}
	}

	c.logger.Debug("backfill done", "host", host, "count", len(ops), "last_ulid", lastUlid)

	return nil
}
