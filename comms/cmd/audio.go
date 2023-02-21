package cmd

import (
	"fmt"
	"math/rand"
	"sync"

	"github.com/spf13/cobra"

	"comms.audius.co/shared/utils"
)

var audioCount uint
var durationMean uint

var audioCmd = &cobra.Command{
	Use:   "audio",
	Short: "seed random audio",
	Long: `seed random audio file using ffmpeg

	./comms storage seed audio # defaults to 100 audio files
	./comms storage seed audio --count 10 # seeds 10 audio files
	`,
	Run: func(cmd *cobra.Command, args []string) {
		wg := sync.WaitGroup{}
		for i := 0; i < int(audioCount); i++ {
			wg.Add(1)
			go generateAndUpload(i, &wg)
		}

		wg.Wait()
	},
}

func init() {
	seedCmd.AddCommand(audioCmd)
	audioCmd.Flags().UintVarP(&audioCount, "count", "c", 100, "the number of random audio files")
	audioCmd.Flags().UintVarP(&durationMean, "mean", "c", 60, "the mean amount of seconds the audio files are")
}

func generateAndUpload(i int, wg *sync.WaitGroup) {
	defer wg.Done()

	audioData, err := utils.GenerateWhiteNoise(durationMean)
	if err != nil {
		fmt.Printf("error generating audio %d - %+v\n", i, err)
		return
	}

	filename := fmt.Sprintf("audio-seed-%d.mp3", i)

	var nodeNumber int
	if multi {
		nodeNumber = rand.Intn(4)
	} else {
		nodeNumber = 0
	}
	storageClient := ClientList[nodeNumber]

	err = storageClient.UploadAudio(audioData, filename)
	if err != nil {
		fmt.Printf("error uploading audio %d\n", i)
		return
	}

	fmt.Printf("[%d] Done (%s)\n", i, storageClient.Endpoint)
}
