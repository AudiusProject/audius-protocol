package server

import (
	"context"
	"fmt"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
)

func (ss *MediorumServer) startFixTruncatedQmWorker() {
	logger := ss.logger.With("task", "fixTruncatedQm")
	ctx := context.Background()
	var err error

	_, err = ss.pgPool.Exec(ctx, `insert into cursors (host, last_ulid) values ('qm_fix_truncated', '') on conflict do nothing`)
	if err != nil {
		logger.Error("create cursor failed", "err", err)
		return
	}

	for {
		time.Sleep(time.Second * 10)

		var cidCursor string
		err = pgxscan.Select(ctx, ss.pgPool, &cidCursor, `select last_ulid from cursors where host = 'qm_fix_truncated'`)
		if err != nil {
			logger.Error("select cursor failed", "err", err)
			continue
		}

		var cidBatch []string
		err = pgxscan.Select(ctx, ss.pgPool, &cidBatch,
			`select key
			 from qm_cids
			 where key > $1
			 order by key
			 limit 1000`, cidCursor)
		if err != nil {
			logger.Warn("select qm_cids batch failed", "err", err)
			continue
		}

		if len(cidBatch) == 0 {
			break
		}

		for _, cid := range cidBatch {
			sniffResult := ss.sniffAndFix(cid, false)
			if len(sniffResult) == 0 {
				continue
			}
			best := sniffResult[0]
			for _, hostBlob := range sniffResult {
				if hostBlob.Attr.Size < best.Attr.Size {
					u := fmt.Sprintf("%s/internal/blobs/location/%s?sniff=1&fix=1", hostBlob.Host, cid)
					_, err := ss.reqClient.R().Get(u)
					if err != nil {
						logger.Info("fix failed", "url", u, "err", err)
					}
				}
			}
		}

		_, err = ss.pgPool.Exec(ctx, `update cursors set last_ulid = $1 where host = 'qm_fix_truncated'`, cidBatch[len(cidBatch)-1])
		if err != nil {
			logger.Warn("update cursor failed", "err", err)
		}

	}

}
