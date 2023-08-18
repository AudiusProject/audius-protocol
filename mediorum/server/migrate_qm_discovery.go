package server

import (
	"bufio"
	"context"
	"embed"
	"errors"
	"fmt"
	"io"
	"mediorum/cidutil"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"gocloud.dev/gcerrors"
	"golang.org/x/exp/slices"
	"golang.org/x/sync/errgroup"
)

// NOTE: These steps require comenting and uncommenting out various parts. That's up to you to figure out ;)

// STEP 1: Get CIDs from Discovery with this SQL:

// select cover_art_sizes, track_cid, track_id from tracks where is_current = true;
// select cover_photo_sizes, profile_picture_sizes, user_id from users where is_current = true;
// select playlist_image_sizes_multihash, playlist_id from playlists where is_current = true;
// Export these as tab-separates files into the tracks_is_current.txt, users_is_current.txt, and playlists_is_current.txt files in this directory.

//go:embed tracks_is_current.txt users_is_current.txt playlists_is_current.txt
// var content embed.FS

//go:embed encoded_track_ids_cids.txt image_cids.txt
var contentSecondPass embed.FS

// STEP 2: Run migrateQmDiscovery()

// STEP 3: Separate track and image CIDs with this script:

/* Using `failedToMigrate` from first pass, run this to get the cids that are still missing:
with open('missing_cids.txt', 'r') as infile, \
     open('track_cids.txt', 'w') as track_outfile, \
     open('image_cids.txt', 'w') as image_outfile:

    for line in infile:
        line = line.strip()
        while line and line[0] in '\t"':
            line = line[1:]
        while line and line[-1] in '\t",':
            line = line[:-1]

        if line.startswith("skipping track_cid for now: "):
            track_outfile.write(line.split(': ')[1] + '\n')
        elif line.endswith('.jpg'):
            image_outfile.write(line + '\n')

*/

// STEP 4: For track CIDs, run this SQL to get each missing filter out deleted/delisted track:

// SELECT track_id, track_cid FROM tracks WHERE is_current = true AND is_delete = false AND is_available = true AND track_cid IN (...);
// Save this to track_ids_cids.txt, separated by tabs.

// STEP 5: Run this to replace track_ids with the encoded track_ids (first do pip install hashids==1.2.0):

/*
from hashids import Hashids
from typing import cast

HASH_MIN_LENGTH = 5
HASH_SALT = "azowernasdfoia"

hashids = Hashids(min_length=5, salt=HASH_SALT)


def encode_int_id(id: int):
    # if id is already a string, assume it has already been encoded
    if isinstance(id, str):
        return id
    return cast(str, hashids.encode(id))

input_file_path = "track_ids_cids.txt"
output_file_path = "encoded_track_ids_cids.txt"

with open(input_file_path, 'r') as infile, open(output_file_path, 'w') as outfile:
    for line in infile:
        id_str, cid = line.strip().split('\t')
        encoded_id = encode_int_id(int(id_str))
        outfile.write(f"{encoded_id}\t{cid}\n")
*/

// STEP 6: Copy over image files as well, and run fixMissingCids(), making sure it calls fixImageCID() and not fixLegacyImageCID() for each line

// STEP 7: View the routes (see server.go) to see which CIDs were migrated, fixed, or failed. Re-run the failed ones.

// STEP 8: Run these on Discovery to get images in the super duper old format (I've already included them in super_duper_legacy_image_cids.txt):
// Note: These are users who are suuuper old and have not since edited their profile/track/playlist, which would've triggered moving the old to the new.
// select cover_art from tracks where is_current = true and cover_art is not null;
// select profile_picture from users where is_current = true and profile_picture is not null;
// select cover_photo from users where is_current = true and cover_photo is not null;
// select playlist_image_multihash from playlists where is_current = true playlist_image_multihash is not null;

// STEP 9: Run fixMissingCids(), but this make it call fixLegacyImageCID() on each line and not fixImageCID()

// STEP 10: Do the same thing again, but this time uncomment out the part to duplicate the unsized (just plain CID) images to all sizes

var numImageSuccesses int
var numTrackCidSuccesses int
var failedToMigrate []string
var migrateDone bool
var migrateMu = sync.RWMutex{}

var migratedImageCids []string
var fixedTrackCids []string
var fixedImageCids []string
var failedTrackCids []string
var failedImageCids []string
var fixDone bool
var fixMu = sync.RWMutex{}

func (ss *MediorumServer) migrateQmDiscovery() {
	files := map[string][]string{
		"tracks_is_current.txt":    {"cover_art_sizes", "track_cid", "track_id"},
		"users_is_current.txt":     {"cover_photo_sizes", "profile_picture_sizes", "user_id"},
		"playlists_is_current.txt": {"playlist_image_sizes_multihash", "playlist_id"},
	}
	for file, columns := range files {
		err := ss.readFile(file, columns)
		if err != nil {
			ss.logger.Error("Failed to read file", "file", file, "error", err)
		}
	}
	migrateDone = true
}

func (ss *MediorumServer) readFile(filename string, columns []string) error {
	file, err := content.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	g, _ := errgroup.WithContext(context.Background())
	g.SetLimit(100)

	scanner := bufio.NewScanner(file)
	sizes := []string{"150x150.jpg", "480x480.jpg", "1000x1000.jpg", "original.jpg"}
	cover_photo_sizes := []string{"640x.jpg", "2000x.jpg", "original.jpg"}
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, "\t")

		if len(parts) != len(columns) {
			ss.logger.Error("skipping line because it doesn't have the right number of columns", "line", line)
			continue
		}

		for i, part := range parts {
			column := columns[i]
			cid := part
			g.Go(func() error {
				if column == "cover_art_sizes" || column == "profile_picture_sizes" || column == "playlist_image_sizes_multihash" {
					ss.migrateImageSizes(cid, &sizes)
				} else if column == "cover_photo_sizes" {
					ss.migrateImageSizes(cid, &cover_photo_sizes)
				} else if column == "track_cid" {
					ss.migrateTrackCID(cid)
				}
				return nil
			})
		}
	}

	g.Wait()
	return scanner.Err()
}

func (ss *MediorumServer) copyFromAnotherNodeToMyBucket(blobUrl string, key string) error {
	tempFilePath, err := downloadToTempFile(blobUrl)
	if tempFilePath != "" {
		defer os.Remove(tempFilePath)
	}
	if err != nil {
		return err
	}
	source, err := os.Open(tempFilePath)
	if err != nil {
		return err
	}
	defer source.Close()

	// write to bucket and record in blobs table that we have it
	return ss.replicateToMyBucket(key, source)
}

func (ss *MediorumServer) migrateImageSizes(cidOrDirCid string, sizes *[]string) {
	if !strings.HasPrefix(cidOrDirCid, "Qm") {
		return
	}

	for _, size := range *sizes {
		if !ss.migrateImage(cidOrDirCid, size) {
			migrateMu.Lock()
			failedToMigrate = append(failedToMigrate, fmt.Sprintf("%s/%s", cidOrDirCid, size))
			migrateMu.Unlock()
		} else {
			migrateMu.Lock()
			numImageSuccesses++
			migrateMu.Unlock()
		}
	}
}

func (ss *MediorumServer) migrateImage(cidOrDirCid string, size string) bool {
	key := fmt.Sprintf("%s/%s", cidOrDirCid, size)

	// check if it's already migrated on this node
	attr, err := ss.bucket.Attributes(context.Background(), key)
	if err == nil && attr.Size > 0 {
		return true
	}
	if err != nil && gcerrors.Code(err) != gcerrors.NotFound {
		return false
	}

	// check if it's already migrated on another node
	hostWithMigratedBlob, err := ss.findNodeToServeBlob(key)
	if err == nil && hostWithMigratedBlob != "" {
		return true
	}

	// try to migrate from own disk first
	diskPath := getDiskPathOnlyIfFileExists("", cidOrDirCid, cidOrDirCid)
	if diskPath != "" {
		err = ss.moveFromDiskToMyBucket(diskPath, key, false)
		if err == nil {
			return true
		}
	}

	// try to download from legacy path on another host in the network
	urlWithBlob, err := ss.findNodeToServeUnmigratedImage(cidOrDirCid, size)
	if err == nil && urlWithBlob != "" {
		err = ss.copyFromAnotherNodeToMyBucket(urlWithBlob, key)
		if err == nil {
			return true
		}
	}

	// we couldn't find it anywhere :(
	return false
}

func (ss *MediorumServer) migrateTrackCID(cid string) {
	if !strings.HasPrefix(cid, "Qm") {
		return
	}

	// check if it's already migrated on this node
	bucketKey := cidutil.ShardCID(cid)
	migrated, err := ss.bucket.Exists(context.Background(), bucketKey)
	if err != nil {
		migrateMu.Lock()
		failedToMigrate = append(failedToMigrate, fmt.Sprintf("skipping track_cid for now: %s", cid))
		migrateMu.Unlock()
		return
	}
	if migrated {
		migrateMu.Lock()
		numTrackCidSuccesses++
		migrateMu.Unlock()
		return
	}

	// check if it's already migrated on another node
	hostWithMigratedBlob, err := ss.findNodeToServeBlob(cid)
	if err == nil && hostWithMigratedBlob != "" {
		migrateMu.Lock()
		numTrackCidSuccesses++
		migrateMu.Unlock()
		return
	}

	migrateMu.Lock()
	failedToMigrate = append(failedToMigrate, fmt.Sprintf("skipping track_cid for now: %s", cid))
	migrateMu.Unlock()
}

func (ss *MediorumServer) findNodeToServeUnmigratedImage(cid string, size string) (string, error) {
	ctx := context.Background()

	cidLookupHosts, err := ss.findHostsWithCid(ctx, cid)
	if err != nil {
		return "", err
	}

	healthyHosts := ss.findHealthyPeers(2 * time.Minute)

	// find the first healthy host that we know has the cid (thanks to our cid_lookup table)
	for _, host := range cidLookupHosts {
		if !slices.Contains(healthyHosts, host) || host == ss.Config.Self.Host {
			continue
		}
		urlStr := fmt.Sprintf("%s/content/%s/%s", host, cid, size)
		u, err := url.Parse(urlStr)
		if err != nil {
			continue
		}
		if dest, is200 := ss.diskCheckUrl(*u, host); is200 {
			return dest, nil
		}
	}

	// check healthy hosts via HEAD request to see if they have the cid but aren't in our cid_lookup
	for _, host := range healthyHosts {
		if host == ss.Config.Self.Host || slices.Contains(cidLookupHosts, host) {
			continue
		}
		urlStr := fmt.Sprintf("%s/content/%s/%s", host, cid, size)
		u, err := url.Parse(urlStr)
		if err != nil {
			continue
		}
		if dest, is200 := ss.diskCheckUrl(*u, host); is200 {
			return dest, nil
		}
	}

	return "", nil
}

func (ss *MediorumServer) fixMissingCids() {
	time.Sleep(time.Minute)
	defer func() {
		fixMu.Lock()
		fixDone = true
		fixMu.Unlock()
	}()

	trackFile, err := contentSecondPass.Open("encoded_track_ids_cids.txt")
	if err != nil {
		ss.logger.Error("Failed to open file", "file", "track_cids.txt", "error", err)
		return
	}
	defer trackFile.Close()

	g, _ := errgroup.WithContext(context.Background())
	g.SetLimit(300)

	scanner := bufio.NewScanner(trackFile)
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, "\t")
		if len(parts) != 2 {
			ss.logger.Error("skipping line because it doesn't have track_id + track_cid", "line", line)
			continue
		}
		trackId := parts[0]
		trackCid := parts[1]
		g.Go(func() error {
			ss.fixTrackCID(trackId, trackCid)
			return nil
		})
	}
	if err := scanner.Err(); err != nil {
		ss.logger.Error("Failed to read file", "file", "track_cids.txt", "error", err)
		return
	}

	g.Wait()

	imageFile, err := contentSecondPass.Open("image_cids.txt")
	if err != nil {
		ss.logger.Error("Failed to open file", "file", "image_cids.txt", "error", err)
		return
	}
	defer imageFile.Close()

	scanner = bufio.NewScanner(imageFile)
	for scanner.Scan() {
		imageLine := scanner.Text()
		if !strings.Contains(imageLine, "/") && strings.HasPrefix(imageLine, "Qm") {
			// try to fix super legacy format (`cover_art`, `profile_picture`, `cover_photo`, `playlist_image_multihash`)
			imageCid := imageLine
			g.Go(func() error {
				ss.fixLegacyImageCID(imageCid)
				return nil
			})
			continue
		}

		parts := strings.Split(imageLine, "/")
		if len(parts) != 2 {
			ss.logger.Error("skipping line because it doesn't have cid + size", "line", imageLine)
			continue
		}
		imageCid := parts[0]
		size := parts[1]
		g.Go(func() error {
			ss.fixImageCID(imageCid, size)
			return nil
		})
	}

	err = scanner.Err()
	if err != nil {
		ss.logger.Error("scanner error", "error", err)
	}

	g.Wait()
}

func (ss *MediorumServer) fixTrackCID(encodedId, cid string) {
	// check if it's already migrated on this node
	bucketKey := cidutil.ShardCID(cid)
	migrated, err := ss.bucket.Exists(context.Background(), bucketKey)
	if err == nil && migrated {
		return
	}

	// check if it's already migrated on another node
	hostWithMigratedBlob, err := ss.findNodeToServeBlob(cid)
	if err == nil && hostWithMigratedBlob != "" {
		return
	}

	// try to read from discovery, which will query all content nodes (and attempt their legacy disk path)
	resp, err := http.Get(fmt.Sprintf("https://discoveryprovider2.audius.co/v1/tracks/%s/stream", encodedId))
	if err != nil || (resp.StatusCode != http.StatusOK) {
		if resp.StatusCode == http.StatusPartialContent {
			ss.logger.Error("got partial content when we expected to get the whole file", "encodedId", encodedId, "cid", cid)
		}
		fixMu.Lock()
		failedTrackCids = append(failedTrackCids, cid)
		fixMu.Unlock()
		return
	}
	defer resp.Body.Close()

	// follow the redirect to download the whole file
	tempFilePath, err := downloadToTempFile(resp.Request.URL.String())
	if tempFilePath != "" {
		defer os.Remove(tempFilePath)
	}
	if err != nil {
		fixMu.Lock()
		failedTrackCids = append(failedTrackCids, cid)
		fixMu.Unlock()
		return
	}
	source, err := os.Open(tempFilePath)
	if err != nil {
		fixMu.Lock()
		failedTrackCids = append(failedTrackCids, cid)
		fixMu.Unlock()
		return
	}
	defer source.Close()

	// replicate from temp file so we have it in our CDK bucket
	err = ss.replicateToMyBucket(cid, source)
	if err != nil {
		fixMu.Lock()
		failedTrackCids = append(failedTrackCids, cid)
		fixMu.Unlock()
		return
	}

	fixMu.Lock()
	fixedTrackCids = append(fixedTrackCids, cid)
	fixMu.Unlock()
}

var orderedSizes = []string{"original.jpg", "2000x.jpg", "640x.jpg", "1000x1000.jpg", "480x480.jpg", "150x150.jpg"}

func (ss *MediorumServer) fixImageCID(cid, size string) {
	key := fmt.Sprintf("%s/%s", cid, size)
	// check if it's already migrated on this node
	attr, err := ss.bucket.Attributes(context.Background(), key)
	if err == nil && attr.Size > 0 {
		return
	}

	// check if it's already migrated on another node
	hostWithMigratedBlob, err := ss.findNodeToServeBlob(key)
	if err == nil && hostWithMigratedBlob != "" {
		return
	}

	// try to migrate from own disk first
	diskPath := getDiskPathOnlyIfFileExists("", cid, cid)
	if diskPath != "" {
		err = ss.moveFromDiskToMyBucket(diskPath, key, false)
		if err == nil {
			fixMu.Lock()
			migratedImageCids = append(migratedImageCids, key)
			fixMu.Unlock()
			return
		}
	}

	// try to download from legacy path on another host in the network
	urlWithBlob, err := ss.findNodeToServeUnmigratedImage(cid, size)
	if err == nil && urlWithBlob != "" {
		err = ss.copyFromAnotherNodeToMyBucket(urlWithBlob, key)
		if err == nil {
			fixMu.Lock()
			migratedImageCids = append(migratedImageCids, key)
			fixMu.Unlock()
			return
		}
	}

	// we can't resize to original.jpg because we don't know the original dimensions
	if size == "original.jpg" {
		fixMu.Lock()
		failedImageCids = append(failedImageCids, key)
		fixMu.Unlock()
		return
	}

	// try to get the original image and resize it to the missing image
	// if the original is missing, resize from the biggest image we have
	i := 0
	for i < len(orderedSizes) {
		if ss.resizeImage(cid, orderedSizes[i], size) {
			fixMu.Lock()
			fixedImageCids = append(fixedImageCids, key)
			fixMu.Unlock()
			return
		}
		i++
	}

	fixMu.Lock()
	failedImageCids = append(failedImageCids, key)
	fixMu.Unlock()
}

func (ss *MediorumServer) resizeImage(cid, sourceSize, targetSize string) bool {
	if sourceSize == targetSize {
		return false
	}

	targetKey := fmt.Sprintf("%s/%s", cid, targetSize)

	// try to download the source size from the network
	tempFilePath, err := ss.downloadImageToTempFile(cid, sourceSize)
	if tempFilePath != "" {
		defer os.Remove(tempFilePath)
	}
	if err != nil {
		return false
	}
	temp, err := os.Open(tempFilePath)
	if err != nil {
		return false
	}
	defer temp.Close()

	// resize source size to target size
	targetSizeNoExt := targetSize[:len(targetSize)-4]
	switch targetSizeNoExt {
	case "150x150", "480x480", "1000x1000":
		targetBox, err := strconv.Atoi(strings.Split(targetSizeNoExt, "x")[0])
		if err != nil {
			return false
		}
		temp.Seek(0, 0)
		out, _, _ := Resized(".jpg", temp, targetBox, targetBox, "fill")
		err = ss.replicateToMyBucket(targetKey, out)
		if err == nil {
			return true
		}
	case "640x", "2000x":
		targetWidth, err := strconv.Atoi(targetSizeNoExt[:len(targetSizeNoExt)-1])
		if err != nil {
			return false
		}
		temp.Seek(0, 0)
		out, _, _ := Resized(".jpg", temp, targetWidth, AUTO, "fill")

		err = ss.replicateToMyBucket(targetKey, out)
		if err == nil {
			return true
		}

	}
	return false
}

func (ss *MediorumServer) downloadImageToTempFile(cid, size string) (string, error) {
	key := fmt.Sprintf("%s/%s", cid, size)

	// check if it's already migrated on this node
	attr, err := ss.bucket.Attributes(context.Background(), key)
	if err != nil {
		if gcerrors.Code(err) != gcerrors.NotFound {
			return "", err
		}
	} else if attr != nil && attr.Size > 0 {
		r, err := ss.bucket.NewReader(context.Background(), key, nil)
		if err != nil {
			return "", err
		}
		defer r.Close()
		tempFile, err := os.CreateTemp("", "mediorumDownloadQm")
		if err != nil {
			return "", err
		}
		defer tempFile.Close()
		_, err = io.Copy(tempFile, r)
		if err != nil {
			return "", err
		}
		return tempFile.Name(), nil
	}

	// check if it's already migrated on another node
	hostWithMigratedBlob, err := ss.findNodeToServeBlob(key)
	if err == nil && hostWithMigratedBlob != "" {
		urlStr := fmt.Sprintf("%s/content/%s", hostWithMigratedBlob, key)
		return downloadToTempFile(urlStr)
	}

	// check if it's on our disk
	diskPath := getDiskPathOnlyIfFileExists("", cid, cid)
	if diskPath != "" {
		tempFile, err := os.CreateTemp("", "mediorumDownloadQm")
		if err != nil {
			return "", err
		}
		defer tempFile.Close()
		r, err := os.Open(diskPath)
		if err != nil {
			return "", err
		}
		defer r.Close()
		_, err = io.Copy(tempFile, r)
		if err != nil {
			return "", err
		}
		return tempFile.Name(), nil
	}

	// try to download from legacy path on another host in the network
	urlWithBlob, err := ss.findNodeToServeUnmigratedImage(cid, size)
	if err == nil && urlWithBlob != "" {
		urlStr := fmt.Sprintf("%s/content/%s", hostWithMigratedBlob, key)
		return downloadToTempFile(urlStr)
	}

	return "", errors.New("couldn't find image")
}

func downloadToTempFile(urlStr string) (string, error) {
	resp, err := http.Get(urlStr)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	tempFile, err := os.CreateTemp("", "mediorumDownloadQm")
	if err != nil {
		return "", err
	}
	defer tempFile.Close()

	_, err = io.Copy(tempFile, resp.Body)
	if err != nil {
		return "", err
	}

	return tempFile.Name(), nil
}

func (ss *MediorumServer) fixLegacyImageCID(cid string) {
	// check if it's already migrated on this node
	shardedCid := cidutil.ShardCID(cid)
	attr, err := ss.bucket.Attributes(context.Background(), shardedCid)
	if err == nil && attr.Size > 0 {
		// ONLY RUN THIS BLOCK AFTER RUNNING THE CODE AFTER IT. FIRST, JUST RETURN EARLY ON THIS LINE

		// assuming it exists now, copy to every other size key
		for _, size := range orderedSizes {
			dstKey := fmt.Sprintf("%s/%s", cid, size)
			exists, err := ss.bucket.Exists(context.Background(), dstKey)
			if err == nil && !exists {
				err = ss.bucket.Copy(context.Background(), dstKey, shardedCid, nil)
				// record that we "have" this key
				if err != nil {
					fixMu.Lock()
					failedImageCids = append(failedImageCids, cid)
					fixMu.Unlock()
					return
				}
				var exists bool
				ss.crud.DB.Raw(
					"SELECT EXISTS(SELECT 1 FROM blobs WHERE host = ? AND key = ? LIMIT 1)",
					ss.Config.Self.Host,
					dstKey,
				).Scan(&exists)
				if !exists {
					err = ss.crud.Create(&Blob{
						Host:      ss.Config.Self.Host,
						Key:       dstKey,
						CreatedAt: time.Now().UTC(),
					})
					if err != nil {
						fixMu.Lock()
						failedImageCids = append(failedImageCids, cid)
						fixMu.Unlock()
						return
					}
				}

				fixMu.Lock()
				migratedImageCids = append(migratedImageCids, cid)
				fixMu.Unlock()
			}
		}
		return
	}

	// FIRST UNCOMMENT BELOW AND RUN THIS

	// // check if it's already migrated on another node
	// hostWithMigratedBlob, err := ss.findNodeToServeBlob(cid)
	// if err == nil && hostWithMigratedBlob != "" {
	// 	return
	// }

	// // try to migrate from own disk first
	// diskPath := getDiskPathOnlyIfFileExists("", cid, cid)
	// if diskPath != "" {
	// 	err = ss.moveFromDiskToMyBucket(diskPath, cid, false)
	// 	if err == nil {
	// 		fixMu.Lock()
	// 		migratedImageCids = append(migratedImageCids, cid)
	// 		fixMu.Unlock()
	// 		return
	// 	}
	// }

	// // try to download from legacy path on another host in the network
	// urlWithBlob, err := ss.findNodeToServeUnmigratedLegacyImage(cid)
	// if err == nil && urlWithBlob != "" {
	// 	err = ss.copyFromAnotherNodeToMyBucket(urlWithBlob, cid)
	// 	if err == nil {
	// 		fixMu.Lock()
	// 		migratedImageCids = append(migratedImageCids, cid)
	// 		fixMu.Unlock()
	// 		return
	// 	}
	// }

	// fixMu.Lock()
	// failedImageCids = append(failedImageCids, cid)
	// fixMu.Unlock()
}

func (ss *MediorumServer) findNodeToServeUnmigratedLegacyImage(cid string) (string, error) {
	ctx := context.Background()

	cidLookupHosts, err := ss.findHostsWithCid(ctx, cid)
	if err != nil {
		return "", err
	}

	healthyHosts := ss.findHealthyPeers(2 * time.Minute)

	// find the first healthy host that we know has the cid (thanks to our cid_lookup table)
	for _, host := range cidLookupHosts {
		if !slices.Contains(healthyHosts, host) || host == ss.Config.Self.Host {
			continue
		}
		urlStr := fmt.Sprintf("%s/content/%s", host, cid)
		u, err := url.Parse(urlStr)
		if err != nil {
			continue
		}
		if dest, is200 := ss.diskCheckUrl(*u, host); is200 {
			return dest, nil
		}
	}

	// check healthy hosts via HEAD request to see if they have the cid but aren't in our cid_lookup
	for _, host := range healthyHosts {
		if host == ss.Config.Self.Host || slices.Contains(cidLookupHosts, host) {
			continue
		}
		urlStr := fmt.Sprintf("%s/content/%s", host, cid)
		u, err := url.Parse(urlStr)
		if err != nil {
			continue
		}
		if dest, is200 := ss.diskCheckUrl(*u, host); is200 {
			return dest, nil
		}
	}

	return "", nil
}
