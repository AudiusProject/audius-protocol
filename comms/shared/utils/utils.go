package utils

import (
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"time"
)

const (
	IMAGE_GENERATOR = "https://api.dicebear.com/5.x/pixel-art/png"
)

func Keys[K comparable, V any](m map[K]V) []K {
	keys := make([]K, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func GenerateWhiteNoise() ([]byte, error) {

	id := rand.Int()
	tmpFile := fmt.Sprintf("tmp-%d.mp3", id)
	defer os.Remove(tmpFile)

	duration := 60 + 10
	cmd := exec.Command("ffmpeg", "-y", // Yes to all
		"-f",                                    // audio/video filtering framework
		"lavfi",                                 // provides generic audio filtering for audio/video signals
		"-i",                                    // input flag
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

func GetRandomPng() ([]byte, error) {
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
