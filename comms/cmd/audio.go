package cmd

import (
	"bytes"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var audioCount int

// audioCmd represents the audio command
var audioCmd = &cobra.Command{
	Use:   "audio",
	Short: "seed random audio",
	Long: `seed random audio file using ffmpeg

	./comms storage seed audio # defaults to 100 audio files
	./comms storage seed audio --count 10 # seeds 10 audio files
	`,
	Run: func(cmd *cobra.Command, args []string) {
		for i := 0; i < audioCount; i++ {
			audioData, err := generateWhiteNoiseFFmpeg()
			if err != nil {
				fmt.Printf("error generating audio %d - %+v\n", i, err)
				continue
			}

			filename := fmt.Sprintf("audio-seed-%d.mp3", i)

			nodeNumber := rand.Intn(4)
			node := idToNode[nodeNumber]

			err = uploadAudio(node, audioData, filename)
			if err != nil {
				fmt.Printf("error uploading audio %d\n", i)
				continue
			}

			fmt.Printf("[%d] Done (%s)\n", i, node)
		}
	},
}

func init() {
	seedCmd.AddCommand(audioCmd)
	audioCmd.Flags().IntVarP(&audioCount, "count", "c", 100, "the number of random audio files")
}

func generateWhiteNoiseFFmpeg() ([]byte, error){

	id := rand.Int()
	tmpFile := fmt.Sprintf("tmp-%d.mp3", id)

	duration := 60 + 10
	cmd := exec.Command("ffmpeg", "-y", // Yes to all
		"-f", // audio/video filtering framework
		"lavfi", // provides generic audio filtering for audio/video signals
		"-i", // input flag
		fmt.Sprintf("anoisesrc=d=%d", duration), // generate a noise audio signal for the duration
		tmpFile,
    )

    err := cmd.Start() // Start a process on another goroutine
	if err != nil {
		return nil, err
	}

    err = cmd.Wait() // wait until ffmpeg finish
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(tmpFile)

	return data, nil 
}

func uploadAudio(node string, audioData []byte, filename string) error {
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
