package cmd

import (
	"bytes"
	"errors"
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

	"github.com/cryptix/wav"
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

			filename := fmt.Sprintf("audio-seed-%d.wav", i)

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

// Implements io.ReadWriteSeeker for testing purposes.
type FileBuffer struct {
    buffer []byte
    offset int64
}

// Creates new buffer that implements io.ReadWriteSeeker for testing purposes.
func NewFileBuffer(initial []byte) FileBuffer {
    if initial == nil {
        initial = make([]byte, 25, 100)
    }
    return FileBuffer{
        buffer: initial,
        offset: 0,
    }
}

func (fb FileBuffer) Bytes() []byte {
    return fb.buffer
}

func (fb FileBuffer) Len() int {
    return len(fb.buffer)
}

func (fb FileBuffer) Read(b []byte) (int, error) {
    available := len(fb.buffer) - int(fb.offset)
    if available == 0 {
        return 0, io.EOF
    }
    size := len(b)
    if size > available {
        size = available
    }
    copy(b, fb.buffer[fb.offset:fb.offset+int64(size)])
    fb.offset += int64(size)
    return size, nil
}

func (fb FileBuffer) Write(b []byte) (int, error) {
    copied := copy(fb.buffer[fb.offset:], b)
    if copied < len(b) {
        fb.buffer = append(fb.buffer, b[copied:]...)
    }
    fb.offset += int64(len(b))
    return len(b), nil
}

func (fb FileBuffer) Seek(offset int64, whence int) (int64, error) {
    var newOffset int64
    switch whence {
    case io.SeekStart:
        newOffset = offset
    case io.SeekCurrent:
        newOffset = fb.offset + offset
    case io.SeekEnd:
        newOffset = int64(len(fb.buffer)) + offset
    default:
        return 0, errors.New("Unknown Seek Method")
    }
    if newOffset > int64(len(fb.buffer)) || newOffset < 0 {
        return 0, fmt.Errorf("Invalid Offset %d", offset)
    }
    fb.offset = newOffset
    return newOffset, nil
}

func (fb FileBuffer) Close() error {
	return nil
}

func generateWhiteNoise() ([]byte, error) {
	buffer := NewFileBuffer(nil)

	bits := 32
	rate := 44100
	duration := 60

	meta := wav.File{
		Channels:        1,
		SampleRate:      uint32(rate),
		SignificantBits: uint16(bits),
	}

	writer, err := meta.NewWriter(buffer)
	if err != nil {
		return nil, err
	}
	defer writer.Close()


	for i := 0; i < (duration)*(rate); i += 1 {
		var sample []byte = make([]byte, bits/8)

		_, err := rand.Read(sample)
		if err != nil {
			return nil, err
		}

		err = writer.WriteSample(sample)
		if err != nil {
			return nil, err
		}
	}

	return buffer.Bytes(), nil
}

func generateWhiteNoiseFFmpeg() ([]byte, error){
	cmd := exec.Command("ffmpeg", "-y", // Yes to all
		"-f", // audio/video filtering framework
		"lavfi", // provides generic audio filtering for audio/video signals
		"-i", // input flag
		`anoisesrc=d=${duration}`, // generate a noise audio signal for the duration
        "pipe:1", // output to stdout
    )

    resultBuffer := bytes.NewBuffer(make([]byte, 5*1024*1024)) // pre allocate 5MiB buffer

    cmd.Stderr = os.Stderr // bind log stream to stderr
    cmd.Stdout = resultBuffer // stdout result will be written here

    err := cmd.Start() // Start a process on another goroutine
	if err != nil {
		return nil, err
	}

    err = cmd.Wait() // wait until ffmpeg finish
	if err != nil {
		return nil, err
	}

	return resultBuffer.Bytes(), nil 
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
			h.Set("Content-Type", "audio/wav")
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
