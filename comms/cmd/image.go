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
		for i := 0; i < 10; i++ {

			imageData, err := getRandomPng(string(rune(i)))
			if err != nil {
				fmt.Printf("error fetching image %d\n", i)
				continue
			}

			filename := fmt.Sprintf("seed-%d.png", i)
			err = uploadPng(imageData, filename)
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

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// imageCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// imageCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
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

func uploadPng(imageData []byte, filename string) error {
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
			fmt.Println(filename)
			h := make(textproto.MIMEHeader)
			h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, key, filename))
			h.Set("Content-Type", "image/png")
			if fw, err = w.CreatePart(h); err != nil {
				fmt.Printf("Error creating file form field %+v", err)
				return err
			}
		} else {
			// Add other fields
			if fw, err = w.CreateFormField(key); err != nil {
				fmt.Printf("Error creating form field %+v", err)
				return err
			}
		}
		if _, err = io.Copy(fw, r); err != nil {
			fmt.Printf("Error doing io.Copy %+v", err)
			return err
		}

	}
	// Don't forget to close the multipart writer.
	// If you don't close it, your request will be missing the terminating boundary.
	w.Close()

	// Submit the request
	res, err := http.Post(fmt.Sprintf("%s/storage/file", NODE1), w.FormDataContentType(), &b)
	if err != nil {
		fmt.Printf("Error doing Post %+v", err)
		return err
	}

	// Check the response
	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("bad status: %s", res.Status)
		fmt.Printf("Bad status code %+v", err)

		return err
	}

	return nil
}
