#!/bin/bash

# Wait for the pipeline to finish completely
PIPELINE_PENDING="true"
while [[ "$PIPELINE_PENDING" == "true" ]]; do
  echo "Fetching pipeline workflows..."
  curl -s --url "https://circleci.com/api/v2/pipeline/${CIRCLE_PIPELINE_ID}/workflow" \
      -H "Circle-Token: ${CIRCLE_TOKEN}" \
      > /tmp/workflows.json
  echo "Pipeline workflows fetched..."
  PIPELINE_PENDING=$(jq ".items | map(select(.id != \"${CIRCLE_WORKFLOW_ID}\") | .status == \"running\" or \"status\" == \"failing\" ) | any" < /tmp/workflows.json)
  if [[ "$PIPELINE_PENDING" == "true" ]]; then
    echo "Pipeline still has pending workflows. Sleeping for 30s..."
    sleep 30
  fi
done
echo "Pipeline finished"