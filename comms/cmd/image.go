/*
Copyright © 2023 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"

	"github.com/spf13/cobra"
)

var imageCount int

// imageCmd represents the image command
var imageCmd = &cobra.Command{
	Use:   "image",
	Short: "A brief description of your command",
	Long: `A longer description that spans multiple lines and likely contains examples
and usage of using your command. For example:

Cobra is a CLI library for Go that empowers applications.
This application is a tool to generate the needed files
to quickly create a Cobra application.`,
	Run: func(cmd *cobra.Command, args []string) {
		for i := 0; i < imageCount; i++ {

			seed := fmt.Sprintf("%d", i)
			imageData, err := getRandomPng(seed)
			if err != nil {
				fmt.Printf("error fetching image %d - %+v\n", i, err)
				continue
			}

			filename := fmt.Sprintf("seed-%d.png", i)
			err = uploadPng(NODE1, imageData, filename)
			if err != nil {
				fmt.Printf("error uploading image %d\n", i)
				continue
			}

			fmt.Printf("Done %d\n", i)
		}
	},
}

func init() {
	seedCmd.AddCommand(imageCmd)
	imageCmd.Flags().IntVarP(&imageCount, "count", "c", 100, "the number of random images")
}

func getRandomPng(seed string) ([]byte, error) {
	url := fmt.Sprintf("%s?seed=%s", IMAGE_GENERATOR, seed)
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
	route := "/storage/file"

	values := map[string]io.Reader{
		"files":    bytes.NewReader(imageData),
		"template": strings.NewReader("img_square"),
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
