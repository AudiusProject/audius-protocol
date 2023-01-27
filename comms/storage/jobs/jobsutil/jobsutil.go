// Package jobsutil provides miscellaneous utilities for jobs.
package jobsutil

import (
	"encoding/json"
	"errors"
	"fmt"

	"comms.audius.co/storage/jobs"
)

func UnmarshalJobFromJson(jobBytes []byte) (jobs.Job, error) {
	var job jobs.Job
	var jsonData json.RawMessage
	err := json.Unmarshal(jobBytes, &jsonData)
	if err != nil {
		// Return a new error saying "Invalid KV value"
		return nil, errors.New("invalid KV value: " + string(jobBytes))
	}

	var jobType struct {
		Type jobs.JobType `json:"type"`
	}
	err = json.Unmarshal(jobBytes, &jobType)
	if err != nil {
		return nil, errors.New("invalid KV value: " + string(jobBytes))
	}

	switch jobType.Type {
	case jobs.JobTypeTranscode:
		var transcodeJob jobs.TranscodeJob
		err = json.Unmarshal(jsonData, &transcodeJob)
		if err != nil {
			return nil, errors.New("invalid transcode KV value: " + string(jobBytes))
		}
		job = &transcodeJob
	default:
		return nil, fmt.Errorf("invalid job type: %q in KV value: %s", jobType.Type, string(jobBytes))
	}
	return job, nil
}
