package cmd

import (
	"fmt"
	"math/rand"


	"github.com/spf13/cobra"

	"comms.audius.co/storage/client"
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
			audioData, err := client.GenerateWhiteNoise()
			if err != nil {
				fmt.Printf("error generating audio %d - %+v\n", i, err)
				continue
			}

			filename := fmt.Sprintf("audio-seed-%d.mp3", i)

			nodeNumber := rand.Intn(4)
			node := idToNode[nodeNumber]

			err = client.UploadAudio(node, audioData, filename)
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
