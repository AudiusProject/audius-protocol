#!/bin/bash

echo "Fetching pipeline workflows..."
curl -s --url "https://circleci.com/api/v2/pipeline/${CIRCLE_PIPELINE_ID}/workflow" \
    -H "Circle-Token: ${CIRCLE_TOKEN}" \
    > /tmp/workflows.json
# Get workflow and job statuses list
echo "Generating Workflow Statuses..."
for workflow in $(jq -r -c '.items[] | select(.id != "'$CIRCLE_WORKFLOW_ID'")' /tmp/workflows.json)
do
  workflow_id=$(echo $workflow | jq -r '.id')
  workflow_filename="/tmp/workflow-${workflow_id}.json"
  curl -s 2>/dev/null --url $(echo $workflow | jq -r '"https://circleci.com/api/v2/workflow/\(.id)/job"') -H "Circle-Token: ${CIRCLE_TOKEN}" -o $workflow_filename
  workflow_url=$(echo $workflow | jq -r '"'$PIPELINE_URL'/workflows/\(.id)"')
  if $(jq -r '"\(if .status == "failed" then 1 else 0 end\)"') then
    echo "Failed workflow: $workflow_id"
    return 1
  fi
done
return 0