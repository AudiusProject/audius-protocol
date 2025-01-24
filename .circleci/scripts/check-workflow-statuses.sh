#!/bin/bash

echo "Fetching pipeline workflows..."
curl -s --url "https://circleci.com/api/v2/pipeline/${CIRCLE_PIPELINE_ID}/workflow" \
    -H "Circle-Token: ${CIRCLE_TOKEN}" \
    > /tmp/workflows.json
# Get workflow and job statuses list
echo "Generating Workflow Statuses..."
for workflow in $(jq -r -c '.items[] | select(.id != "'$CIRCLE_WORKFLOW_ID'")' /tmp/workflows.json)
do
  workflow_name=$(echo $workflow | jq -r '.name')
  if [[ $(echo $workflow | jq -r 'if .status == "failed" then 1 else 0 end') == "1" ]]
  then
    echo "Failed workflow: $workflow_name"
    exit 1
  fi
done
exit 0