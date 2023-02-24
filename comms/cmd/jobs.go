package cmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"
)

var withNodes bool

var jobsCmd = &cobra.Command{
	Use:   "jobs",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		clientCount, err := initClients()
		if err != nil || clientCount < 1 {
			fmt.Println("Couldn't find any clients")
			return
		}

		client := ClientList[0]
		jobs, err := client.GetJobs()
		if err != nil {
			fmt.Printf("getting jobs error, %+v\n", jobs)
			return
		}

		jobIds := []string{}
		for _, job := range jobs {
			jobIds = append(jobIds, job.ID)
		}

		if !withNodes {
			prettyPrint, err := json.MarshalIndent(jobIds, "", "  ")
			if err != nil {
				return
			}

			fmt.Printf("%s\n", string(prettyPrint))
			return
		}

		jobIdToNodes := map[string][]string{}
	for _, job := range jobs {
		nodes, err := client.GetStorageNodesFor(job.ID)
		if err != nil {
			jobIdToNodes[job.ID] = []string{}
			continue
		}

		jobIdToNodes[job.ID] = nodes
	}

	prettyPrint, err := json.MarshalIndent(jobIdToNodes, "", " ")
	if err != nil {
		return
	}

	fmt.Printf("%s\n", string(prettyPrint))
},
}

func init() {
	storageCmd.AddCommand(jobsCmd)

	jobsCmd.Flags().BoolVar(&withNodes, "with-nodes", false, "whether to include the nodes the keys are found on")
}
