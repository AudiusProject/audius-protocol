package server

import (
	"fmt"
	"time"

	"gorm.io/gorm/clause"
)

func (ss *MediorumServer) startUploadScroller() {
	time.Sleep(time.Minute)

	for {
		for _, peer := range ss.Config.Peers {
			if peer.Host == ss.Config.Self.Host {
				continue
			}

			// load prior cursor for host
			var uploadCursor *UploadCursor
			if ss.crud.DB.First(&uploadCursor, "host = ?", peer.Host).Error != nil {
				uploadCursor = &UploadCursor{
					Host: peer.Host,
				}
			}
			logger := ss.logger.With("task", "upload_scroll", "host", peer.Host, "after", uploadCursor.After)

			// fetch uploads from host
			var uploads []*Upload
			u := apiPath(peer.Host, "uploads") + "?after=" + uploadCursor.After.Format(time.RFC3339Nano)

			resp, err := ss.reqClient.R().
				SetSuccessResult(&uploads).
				Get(u)

			if err != nil {
				logger.Error("list uploads failed", "err", err)
				continue
			}
			if resp.StatusCode != 200 {
				err := fmt.Errorf("%s: %s %s", resp.Request.RawURL, resp.Status, string(resp.Bytes()))
				logger.Error("list uploads failed", "err", err)
				continue
			}

			var overwrites []*Upload
			for _, upload := range uploads {

				// get existing upload
				var existing Upload
				err := ss.crud.DB.First(&existing, "id = ?", upload.ID).Error

				// if not exists or is old, overwrite
				if err != nil || existing.TranscodedAt.Before(upload.TranscodedAt) {
					overwrites = append(overwrites, upload)
				}

				// advance cursor
				uploadCursor.After = upload.CreatedAt
			}

			// write overwrites
			err = ss.crud.DB.Clauses(clause.OnConflict{UpdateAll: true}).Create(overwrites).Error
			if err != nil {
				ss.logger.Warn("overwrite upload failed", "err", err)
			}

			// save cursor
			if err := ss.crud.DB.Clauses(clause.OnConflict{UpdateAll: true}).Create(uploadCursor).Error; err != nil {
				logger.Error("save upload cursor failed", "err", err)
			} else {
				logger.Info("OK", "uploads", len(uploads), "overwrites", len(overwrites), "after", uploadCursor.After)
			}

		}

		time.Sleep(time.Minute * 5)
	}

}
