package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var jobsCmd = &cobra.Command{
	Use:   "jobs",
	Short: "",
	Long: ``,
	Run: func(cmd *cobra.Command, args []string) {
		clientCount, err := initClients()
		if err != nil || clientCount < 1 {
			fmt.Println("Couldn't find any clients")
			return
		}

		for _, client := range ClientList {
			jobs, err := client.GetJobs()
			if err != nil {
				fmt.Printf("getting jobs error, %+v\n", jobs)
				continue
			}

			fmt.Printf("[%s] => %+v jobs\n", client.Endpoint, len(jobs))

			for _, job := range jobs {
				fmt.Printf("[%s] => %+v\n", client.Endpoint, job.ID)
			}
		}
	},
}

func init() {
	storageCmd.AddCommand(jobsCmd)
}
