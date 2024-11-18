package server

import (
	"context"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/cidutil"
)

// generateAudioPreviewForUpload exists for the initial preview impl
// which stored preview CID on the upload record itself.
// This is still expected by client when creating + editing a preview.
// When client is fully using generate_preview endpoint, this can probably go away.
func (ss *MediorumServer) generateAudioPreviewForUpload(upload *Upload) error {
	// if a start time is set, also transcode an audio preview from the full 320kbps downsample
	if upload.SelectedPreview.Valid {
		splitPreview := strings.Split(upload.SelectedPreview.String, "|")
		previewStart := splitPreview[1]

		audioPreview, err := ss.generateAudioPreview(context.Background(), upload.TranscodeResults["320"], previewStart)
		if err != nil {
			return err
		}

		upload.TranscodeResults[upload.SelectedPreview.String] = audioPreview.CID
		return ss.crud.Update(upload)
	}
	return nil
}

// generateAudioPreview is the new preview impl which requires only a CID + previewStartSeconds, so that it works with Qm CIDs too.
// It returns an AudioPreview record, and the client can use that to update a track record.
func (ss *MediorumServer) generateAudioPreview(ctx context.Context, fileHash string, previewStartSeconds string) (*AudioPreview, error) {

	if !ss.haveInMyBucket(fileHash) {
		_, err := ss.findAndPullBlob(ctx, fileHash)
		if err != nil {
			return nil, err
		}
	}

	// pull to temp file
	temp, err := ss.getKeyToTempFile(fileHash)
	if err != nil {
		return nil, err
	}
	defer os.Remove(temp.Name())

	srcPath := temp.Name()
	destPath := strings.TrimSuffix(srcPath, "_320.mp3") + "_320_preview.mp3"

	// generate preview
	cmd := exec.Command("ffmpeg",
		"-y",
		"-i", srcPath,
		"-ss", previewStartSeconds, // set preview start time
		"-t", audioPreviewDuration, // set preview duration
		"-b:a", "320k", // set bitrate to 320k
		"-ar", "48000", // set sample rate to 48000 Hz
		"-f", "mp3", // force output to mp3
		"-vn", // no video
		destPath)

	if err := cmd.Run(); err != nil {
		return nil, err
	}

	// replicate to peers
	dest, err := os.Open(destPath)
	if err != nil {
		return nil, err
	}
	defer dest.Close()
	defer os.Remove(destPath)

	previewCid, err := cidutil.ComputeFileCID(dest)
	if err != nil {
		return nil, err
	}

	_, err = ss.replicateFileParallel(previewCid, destPath, nil)
	if err != nil {
		return nil, err
	}

	// save preview cid to some previews table
	audioPreview := &AudioPreview{
		CID:                 previewCid,
		SourceCID:           fileHash,
		PreviewStartSeconds: previewStartSeconds,
		CreatedBy:           ss.Config.Self.Host,
		CreatedAt:           time.Now(),
	}
	err = ss.crud.Create(audioPreview)
	if err != nil {
		return nil, err
	}

	return audioPreview, nil
}
