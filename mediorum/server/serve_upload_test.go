package server

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestUploadFile(t *testing.T) {
	ss := testNetwork[0]
	s2 := testNetwork[1]

	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	{
		fw, err := w.CreateFormField("template")
		assert.NoError(t, err)
		fw.Write([]byte("audio"))
	}

	fw, err := w.CreateFormFile(filesFormFieldName, "hit.ogg")
	assert.NoError(t, err)

	hit, err := os.Open("testdata/hit.ogg")
	assert.NoError(t, err)

	io.Copy(fw, hit)
	hit.Close()
	w.Close()

	resp, err := http.Post(ss.Config.Self.Host+"/uploads", w.FormDataContentType(), &b)
	assert.NoError(t, err)
	assert.Equal(t, resp.StatusCode, 200)

	dec := json.NewDecoder(resp.Body)
	var uploads []Upload
	err = dec.Decode(&uploads)
	assert.NoError(t, err)
	uploadId := uploads[0].ID

	// force sweep (since blob changes SkipBroadcast)
	for _, s := range testNetwork {
		s.crud.ForceSweep()
	}

	// poll for complete
	var u2 *Upload
	for i := 0; i < 200; i++ {
		resp, err := s2.reqClient.R().SetSuccessResult(&u2).Get(s2.Config.Self.Host + "/uploads/" + uploadId)
		assert.NoError(t, err)
		assert.Equal(t, resp.StatusCode, 200)
		if u2.Status == JobStatusDone {
			break
		}
		time.Sleep(time.Second)
	}

	assert.Equal(t, u2.TranscodeProgress, 1.0)
	assert.Len(t, u2.TranscodedMirrors, ss.Config.ReplicationFactor)
}
