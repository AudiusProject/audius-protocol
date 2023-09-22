package server

import (
	"mediorum/cidutil"
	"net/http"
	"os"
	"testing"

	"github.com/oklog/ulid/v2"
	"github.com/stretchr/testify/assert"
)

func TestServeImage(t *testing.T) {
	f, err := os.Open("testdata/claudius.jpg")
	assert.NoError(t, err)

	cid, err := cidutil.ComputeFileCID(f)
	assert.NoError(t, err)
	assert.Equal(t, "baeaaaiqseanfsacci4oa4svwgvcr3sq7kt2bduosa3j4qkvpncwpm4su7axjg", cid)

	f.Seek(0, 0)

	s1, s2, s3, s4 := testNetwork[0], testNetwork[1], testNetwork[2], testNetwork[3]

	s2.replicateToMyBucket(cid, f)

	// the first time it will go get the orig + generate a resized version
	// the x-dynamic-resize-ok header should be set
	{
		resp, err := http.Get(s1.Config.Self.Host + "/content/" + cid + "/150x150.jpg")
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.NotEmpty(t, resp.Header.Get("x-fetch-ok"))
		assert.NotEmpty(t, resp.Header.Get("x-resize-ok"))
	}

	// the second time it should have the variant on disk
	{
		resp, err := http.Get(s1.Config.Self.Host + "/content/" + cid + "/150x150.jpg")
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.Empty(t, resp.Header.Get("x-resize-ok"))
	}

	// it should also have the orig
	{
		resp, err := http.Get(s1.Config.Self.Host + "/content/" + cid + "/original.jpg")
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.Empty(t, resp.Header.Get("x-resize-ok"))
	}

	// some alternate URLs we need to support??
	{
		resp, err := http.Get(s1.Config.Self.Host + "/content/" + cid)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.Empty(t, resp.Header.Get("x-resize-ok"))
	}

	// some alternate URLs we need to support??
	{
		resp, err := http.Get(s1.Config.Self.Host + "/content/" + cid + ".jpg")
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.Empty(t, resp.Header.Get("x-resize-ok"))
	}

	// test with some Qm URLs
	{
		qmKey := "QmQSGUjVkSfGBJCU4dcPn3LC17ikQXbfikGbFUAzL5rcXt/150x150.jpg"
		s2.replicateToMyBucket(qmKey, f)

		resp, err := http.Get(s1.Config.Self.Host + "/content/" + qmKey)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	}

	// via upload ID
	{
		someUlid := ulid.Make().String()

		// only s3 has upload record
		err := s3.crud.DB.Create(&Upload{
			ID:          someUlid,
			OrigFileCID: cid,
		}).Error
		assert.NoError(t, err)

		// can get upload from s3
		{
			u, err := s1.peerGetUpload(s3.Config.Self.Host, someUlid)
			assert.NoError(t, err)
			assert.Equal(t, someUlid, u.ID)
		}

		// can not get upload from s4
		{
			u, err := s1.peerGetUpload(s4.Config.Self.Host, someUlid)
			assert.Error(t, err)
			assert.Nil(t, u)
		}

		// s4 doesn't have upload record
		// but will get it because getUploadOrigCID will find upload record if needed
		resp, err := http.Get(s4.Config.Self.Host + "/content/" + someUlid + "/150x150.jpg")
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	}

}
