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

	./comms storage seed audio # defaults to 100 audio files with 1min mean duration
	./comms storage seed audio --count 10 # seeds 10 audio files
	./comms storage seed audio --mean 3600 # average audio duration is 1hr
	`,
	Run: func(cmd *cobra.Command, args []string) {
		clientCount, err := initClients()
		if err != nil || clientCount < 1 {
			fmt.Println("Couldn't find any clients")
			return
		}

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
	audioCmd.Flags().UintVarP(&durationMean, "mean", "m", 60, "the mean amount of seconds the audio files are")
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
	if single {
		nodeNumber = 0
	} else {
		nodeNumber = rand.Intn(4)
	}
	storageClient := ClientList[nodeNumber]
	if storageClient == nil {
		fmt.Printf("storage client %d is nil\n", nodeNumber)
		return
	}

	err = storageClient.UploadAudio(audioData, filename)
	if err != nil {
		fmt.Printf("error uploading audio %d\n", i)
		return
	}

	fmt.Printf("[%d] Done (%s)\n", i, storageClient.Endpoint)
}
