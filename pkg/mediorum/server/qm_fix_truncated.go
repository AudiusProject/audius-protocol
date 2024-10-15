package server

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
)

func (ss *MediorumServer) startFixTruncatedQmWorker() {
	logger := ss.logger.With("task", "fixTruncatedQm")
	ctx := context.Background()
	var err error

	client := http.Client{
		Timeout: time.Minute * 3,
	}

	_, err = ss.pgPool.Exec(ctx, `insert into cursors (host, last_ulid) values ('qm_fix_truncated', '') on conflict do nothing`)
	if err != nil {
		logger.Error("create cursor failed", "err", err)
		return
	}

	for {
		time.Sleep(time.Second)

		var cidCursor string
		err = pgxscan.Get(ctx, ss.pgPool, &cidCursor, `select last_ulid from cursors where host = 'qm_fix_truncated'`)
		if err != nil {
			logger.Error("select cursor failed", "err", err)
			continue
		}

		var cidBatch []string
		err = pgxscan.Select(ctx, ss.pgPool, &cidBatch,
			`select key
			 from qm_cids
			 where key > $1 AND key not like '%.jpg'
			 order by key
			 limit 20`, cidCursor)
		if err != nil {
			logger.Warn("select qm_cids batch failed", "err", err)
			continue
		}

		if len(cidBatch) == 0 {
			break
		}

		wg := sync.WaitGroup{}
		for _, cid := range cidBatch {
			cid := cid
			wg.Add(1)
			time.Sleep(time.Millisecond)
			go func() {
				defer wg.Done()
				sniffResult := ss.sniffAndFix(cid, false)
				if len(sniffResult) == 0 {
					return
				}
				best := sniffResult[0]
				for _, hostBlob := range sniffResult {
					if hostBlob.Attr.Size < best.Attr.Size {
						u := fmt.Sprintf("%s/internal/blobs/location/%s?sniff=1&fix=1", hostBlob.Host, cid)
						resp, err := client.Get(u)
						if err != nil {
							logger.Warn("failed", "err", err)
							continue
						}
						if resp.StatusCode != 200 {
							logger.Warn("failed bad status", "url", u, "status", resp.StatusCode)
						} else {
							logger.Info("ok", "url", u)
						}
						resp.Body.Close()
					}
				}
			}()
		}

		wg.Wait()

		_, err = ss.pgPool.Exec(ctx, `update cursors set last_ulid = $1 where host = 'qm_fix_truncated'`, cidBatch[len(cidBatch)-1])
		if err != nil {
			logger.Warn("update cursor failed", "err", err)
		}

	}

}
