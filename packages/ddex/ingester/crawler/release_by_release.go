package crawler

import (
	"ingester/common"
	"os"
	"path/filepath"
	"strings"
)

// crawlUnzippedReleaseByRelease finds releases in unzippedRoot (and its subdirectories). For each release, assets are uploaded to the S3 "crawled" bucket, and metadata is stored in Mongo.
// This follows "release-by-release" choreography: https://ernccloud.ddex.net/electronic-release-notification-message-suite-part-3%253A-choreographies-for-cloud-based-storage/5-release-by-release-profile/5.2-file-server-organisation/
func (c *Crawler) crawlUnzippedReleaseByRelease(unzippedRoot string) (*[]common.UnprocessedRelease, error) {
	// The root directory might contain the single release
	release, err := c.getReleaseAndUploadAssets(unzippedRoot, unzippedRoot)
	if err == nil {
		return &[]common.UnprocessedRelease{*release}, nil
	}

	// Or the unzipped contents might include multiple release folders
	var releases []common.UnprocessedRelease
	err = filepath.Walk(unzippedRoot, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if strings.Contains(path, "__MACOSX") || strings.Contains(path, ".DS_Store") {
			return nil
		}

		if info.IsDir() {
			release, err = c.getReleaseAndUploadAssets(unzippedRoot, path)
			if err == nil {
				releases = append(releases, *release)
				return filepath.SkipDir // If <releaseID>.xml is found, don't recurse into subdirectories
			}
		}
		return nil
	})
	return &releases, err
}
