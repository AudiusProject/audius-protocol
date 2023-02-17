package client

import (
	"bytes"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
	"time"
)

type StorageClient struct {
	client http.Client
}

func UploadAudio(node string, audioData []byte, filename string) error {
	rand.Seed(time.Now().UnixNano())

	route := "/storage/file"

	values := map[string]io.Reader{
		"files":    bytes.NewReader(audioData),
		"template": strings.NewReader("audio"),
	}

	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	for key, r := range values {
		var fw io.Writer
		var err error

		if x, ok := r.(io.Closer); ok {
			defer x.Close()
		}
		// Add an image file
		if _, ok := r.(*bytes.Reader); ok {
			h := make(textproto.MIMEHeader)
			h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, key, filename))
			h.Set("Content-Type", "audio/mpeg")
			if fw, err = w.CreatePart(h); err != nil {
				fmt.Printf("Error creating file form field %+v\n", err)
				return err
			}
		} else {
			// Add other fields
			if fw, err = w.CreateFormField(key); err != nil {
				fmt.Printf("Error creating form field %+v\n", err)
				return err
			}
		}
		if _, err = io.Copy(fw, r); err != nil {
			fmt.Printf("Error doing io.Copy %+v\n", err)
			return err
		}

	}
	// Don't forget to close the multipart writer.
	// If you don't close it, your request will be missing the terminating boundary.
	w.Close()

	// Submit the request
	url := fmt.Sprintf("%s%s", node, route)
	res, err := http.Post(url, w.FormDataContentType(), &b)
	if err != nil {
		fmt.Printf("Error doing Post %+v\n", err)
		return err
	}

	// Check the response
	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("bad status: %s", res.Status)
		fmt.Printf("Bad status code %+v\n", err)

		return err
	}

	return nil
}

func UploadPng(node string, imageData []byte, filename string) error {
	rand.Seed(time.Now().UnixNano())

	route := "/storage/file"

	var imageType string
	if rand.Float32() < 0.5 {
		imageType = "img_background"
	} else {
		imageType = "img_square"
	}

	values := map[string]io.Reader{
		"files":    bytes.NewReader(imageData),
		"template": strings.NewReader(imageType),
	}

	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	for key, r := range values {
		var fw io.Writer
		var err error

		if x, ok := r.(io.Closer); ok {
			defer x.Close()
		}
		// Add an image file
		if _, ok := r.(*bytes.Reader); ok {
			h := make(textproto.MIMEHeader)
			h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, key, filename))
			h.Set("Content-Type", "image/png")
			if fw, err = w.CreatePart(h); err != nil {
				fmt.Printf("Error creating file form field %+v\n", err)
				return err
			}
		} else {
			// Add other fields
			if fw, err = w.CreateFormField(key); err != nil {
				fmt.Printf("Error creating form field %+v\n", err)
				return err
			}
		}
		if _, err = io.Copy(fw, r); err != nil {
			fmt.Printf("Error doing io.Copy %+v\n", err)
			return err
		}

	}
	// Don't forget to close the multipart writer.
	// If you don't close it, your request will be missing the terminating boundary.
	w.Close()

	// Submit the request
	url := fmt.Sprintf("%s%s", node, route)
	res, err := http.Post(url, w.FormDataContentType(), &b)
	if err != nil {
		fmt.Printf("Error doing Post %+v\n", err)
		return err
	}

	// Check the response
	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("bad status: %s", res.Status)
		fmt.Printf("Bad status code %+v\n", err)

		return err
	}

	return nil
}
