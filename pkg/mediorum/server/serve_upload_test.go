package server

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestUploadFile(t *testing.T) {
	s1 := testNetwork[0]
	s2 := testNetwork[1]

	var uploads []Upload

	resp := s1.reqClient.R().
		SetFile("files", "testdata/beep.wav").
		SetFormData(map[string]string{"template": "audio"}).
		SetSuccessResult(&uploads).
		MustPost(s1.Config.Self.Host + "/uploads")

	assert.Equal(t, resp.StatusCode, 200)
	uploadId := uploads[0].ID

	// force sweep (since blob changes SkipBroadcast)
	for _, s := range testNetwork {
		s.crud.ForceSweep()
	}

	// poll for complete
	var u2 *Upload
	for i := 0; i < 3; i++ {
		resp, err := s2.reqClient.R().SetSuccessResult(&u2).Get(s2.Config.Self.Host + "/uploads/" + uploadId)
		assert.NoError(t, err)
		assert.Equal(t, resp.StatusCode, 200)
		if u2.Status == JobStatusDone {
			break
		}
		time.Sleep(time.Second)
	}

	assert.Equal(t, u2.TranscodeProgress, 1.0)
	assert.Len(t, u2.TranscodedMirrors, s1.Config.ReplicationFactor)

	// test preview

	{
		var audioPreview AudioPreview
		resp := s1.reqClient.R().
			SetSuccessResult(&audioPreview).
			MustPost(s1.Config.Self.Host + "/generate_preview/" + u2.TranscodeResults["320"] + "/1")
		assert.Equal(t, resp.StatusCode, 200)
		assert.Equal(t, "1", audioPreview.PreviewStartSeconds)
	}
}

func TestUploadPlacement(t *testing.T) {
	s1 := testNetwork[0]
	s2 := testNetwork[1]
	s3 := testNetwork[2]
	s5 := testNetwork[4]

	examplePlacement := []string{
		s3.Config.Self.Host,
		s5.Config.Self.Host,
	}

	var uploads []Upload

	resp := s1.reqClient.R().
		SetFile("files", "testdata/tom.wav").
		SetFormData(map[string]string{
			"template":        "audio",
			"placement_hosts": strings.Join(examplePlacement, ","),
		}).
		SetSuccessResult(&uploads).
		MustPost(s3.Config.Self.Host + "/uploads")

	assert.Equal(t, resp.StatusCode, 200)
	assert.Equal(t, examplePlacement, uploads[0].PlacementHosts)
	uploadId := uploads[0].ID

	// force sweep (since blob changes SkipBroadcast)
	for _, s := range testNetwork {
		s.crud.ForceSweep()
	}

	// poll for complete
	var u2 *Upload
	for i := 0; i < 3; i++ {
		resp, err := s2.reqClient.R().SetSuccessResult(&u2).Get(s3.Config.Self.Host + "/uploads/" + uploadId)
		assert.NoError(t, err)
		assert.Equal(t, resp.StatusCode, 200)
		if u2.Status == JobStatusDone {
			break
		}
		time.Sleep(time.Second)
	}

	assert.Equal(t, u2.TranscodeProgress, 1.0)

	assert.Len(t, u2.Mirrors, len(examplePlacement))
	assert.Len(t, u2.TranscodedMirrors, len(examplePlacement))

	assert.ElementsMatch(t, u2.Mirrors, examplePlacement)
	assert.ElementsMatch(t, u2.TranscodedMirrors, examplePlacement)

	// verify correct blob locations
	{
		locations := testNetworkLocateBlob(u2.OrigFileCID)
		assert.ElementsMatch(t, locations, examplePlacement)

		locations = testNetworkLocateBlob(u2.TranscodeResults["320"])
		assert.ElementsMatch(t, locations, examplePlacement)
	}

	// drop from s5
	s5.dropFromMyBucket(u2.OrigFileCID)

	// run repair
	testNetworkRunRepair(true)

	// verify correct blob locations
	{
		locations := testNetworkLocateBlob(u2.OrigFileCID)
		assert.ElementsMatch(t, locations, examplePlacement)

		locations = testNetworkLocateBlob(u2.TranscodeResults["320"])
		assert.ElementsMatch(t, locations, examplePlacement)
	}

}
