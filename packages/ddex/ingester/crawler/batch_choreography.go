package crawler

import (
	"fmt"
	"ingester/common"
	"os"
	"path/filepath"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

/**
 * In batch choreography:
 * Root dir name is P_<batchID>/ or N_<batchID>/ for priority or not priority (but the examples we have omit the P_ or N_ prefix)
 * Manifest within that folder is BatchComplete_<batchID>.xml
 * Each delivery within the batch is in a folder named <releaseID>/ which contains an XML file named <releaseID>.xml and assets in a resources/ folder
 * Additionally, we could have multiple batches, each in a subdirectory P_<batchID>/ or N_<batchID>/
 */

// crawlUnzippedBatch finds batches of releases in rootDir (and its subdirectories).
// This follows "batch" choreography: https://ernccloud.ddex.net/electronic-release-notification-message-suite-part-3%253A-choreographies-for-cloud-based-storage/6-batch-profile/6.3-file-server-organisation/
func (c *Crawler) crawlUnzippedBatch(unzippedRoot string) (*[]common.UnprocessedBatch, error) {
	// The root directory might contain a batch's ManifestMessage (XML file)
	batch, err := c.getBatchManifest(unzippedRoot, unzippedRoot)
	if err == nil {
		releases, err := c.crawlReleasesInBatch(unzippedRoot, unzippedRoot)
		if err == nil {
			batch.Releases = *releases
		} else {
			c.Logger.Error("Error crawling releases in batch", "error", err)
		}
		return &[]common.UnprocessedBatch{*batch}, nil
	}

	// Or the unzipped contents might include multiple batch folders
	var batches []common.UnprocessedBatch
	err = filepath.Walk(unzippedRoot, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if strings.Contains(path, "__MACOSX") || strings.Contains(path, ".DS_Store") {
			return nil
		}

		if info.IsDir() {
			batch, err := c.getBatchManifest(unzippedRoot, path)
			if err == nil {
				releases, err := c.crawlReleasesInBatch(unzippedRoot, path)
				if err == nil {
					batch.Releases = *releases
					batches = append(batches, *batch)
				} else {
					c.Logger.Error("Error crawling releases in batch", "error", err)
				}
				return filepath.SkipDir
			}
		}
		return nil
	})
	return &batches, err
}

// getBatchManifest parses a "batch delivery" from batchDir if batchDir contains an XML file.
// The XML file is a ManifestMessage detailing one or more deliveries, each in its own subdirectory.
func (c *Crawler) getBatchManifest(unzippedRoot, batchDir string) (*common.UnprocessedBatch, error) {
	// Find the BatchComplete_<batchID>.xml. The batchID should be the same as the directory name
	// TODO: Could parse P_ or N_ prefix from the folder to indicate priority or not priority, but our current examples don't have this.
	// See https://ernccloud.ddex.net/electronic-release-notification-message-suite-part-3%253A-choreographies-for-cloud-based-storage/6-batch-profile/6.3-file-server-organisation/
	batchID := filepath.Base(batchDir)
	xmlPath := filepath.Join(batchDir, fmt.Sprintf("BatchComplete_%s.xml", batchID))
	if _, err := os.Stat(xmlPath); err != nil {
		return nil, fmt.Errorf("failed to find batch XML file %s: %w", xmlPath, err)
	}

	xmlBytes, err := os.ReadFile(xmlPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read batch XML file %s: %w", xmlPath, err)
	}

	xmlRelativePath, err := filepath.Rel(unzippedRoot, xmlPath)
	if err != nil {
		return nil, fmt.Errorf("failed to compute relative path for %s: %w", xmlPath, err)
	}

	batch := &common.UnprocessedBatch{
		BatchID:          batchID,
		BatchXmlPath:     xmlRelativePath,
		BatchXmlContent:  primitive.Binary{Data: xmlBytes, Subtype: 0x00},
		Releases:         []common.UnprocessedRelease{},
		ValidationErrors: []string{},
	}

	return batch, nil
}

func (c *Crawler) crawlReleasesInBatch(unzippedRoot, dir string) (*[]common.UnprocessedRelease, error) {
	// Find each subdirectory (only 1 level lower, not recursively) of the batch, which should contain a release
	files, err := os.ReadDir(unzippedRoot)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory %s: %w", unzippedRoot, err)
	}

	var releases []common.UnprocessedRelease
	for _, file := range files {
		if file.IsDir() && !strings.Contains(file.Name(), "__MACOSX") {
			release, err := c.getReleaseAndUploadAssets(unzippedRoot, filepath.Join(dir, file.Name()))
			if err != nil {
				c.Logger.Error("Error crawling release in batch", "error", err)
			}
			if release != nil {
				releases = append(releases, *release)
			}
		}
	}
	return &releases, nil
}
