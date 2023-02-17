package cmd

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var imageCount int

// imageCmd represents the image command
var imageCmd = &cobra.Command{
	Use:   "image",
	Short: "seed random images",
	Long: `seed random background images (img_background)
	and square images (img_square) to random storage nodes.
	The images are pulled from "dicebear" api

	./comms storage seed image # defaults to 100 images
	./comms storage seed image --count 10 # seeds 10 images
	`,
	Run: func(cmd *cobra.Command, args []string) {
		for i := 0; i < imageCount; i++ {
			imageData, err := getRandomPng()
			if err != nil {
				fmt.Printf("error fetching image %d - %+v\n", i, err)
				continue
			}

			filename := fmt.Sprintf("image-seed-%d.png", i)

			nodeNumber := rand.Intn(4)
			node := idToNode[nodeNumber]

			err = uploadPng(node, imageData, filename)
			if err != nil {
				fmt.Printf("error uploading image %d\n", i)
				continue
			}

			fmt.Printf("[%d] Done (%s)\n", i, node)
		}
	},
}

func init() {
	seedCmd.AddCommand(imageCmd)
	imageCmd.Flags().IntVarP(&imageCount, "count", "c", 100, "the number of random images")
}

func getRandomPng() ([]byte, error) {
	rand.Seed(time.Now().UnixNano())

	seed := rand.Int()
	url := fmt.Sprintf("%s?seed=%d", IMAGE_GENERATOR, seed)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

func uploadPng(node string, imageData []byte, filename string) error {
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
