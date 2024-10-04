package loadtest

import (
	"fmt"
	"math/rand"
	"os"
	"os/exec"
)

func GenerateWhiteNoise(filename string) ([]byte, error) {

	tmpFile := fmt.Sprintf("./tmp/%s", filename)
	defer os.Remove(tmpFile)

	var meanDuration uint = 60
	duration := int((rand.NormFloat64() * 10.0) + float64(meanDuration))

	// generate lossless stereo whitenoise
	cmd := exec.Command("ffmpeg", "-y",
		"-f",
		"lavfi",
		"-i",
		fmt.Sprintf("anoisesrc=d=%d", duration),
		"-ac", "2",
		tmpFile,
	)

	err := cmd.Start()
	if err != nil {
		return nil, err
	}

	err = cmd.Wait()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(tmpFile)

	return data, nil
}
