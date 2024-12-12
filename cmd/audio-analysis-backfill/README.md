# audio analysis backfill program

## building

this will create a docker image and push it to audius dockerhub, make sure to be logged in
```
make release-aa-backfill
```

this will run it on a content node, isProd="false" runs against stage. isProd="true" runs against prod
```
docker run --pull always --network creator-node_creator-node-network -v $(pwd)/output:/app/output -e isProd="false" audius/audio-analysis-backfill:latest
```

take the file and gist it or something so you can commit as a migration to discovery provider
```
curl -X POST -H "Authorization: token GITHUB_ACCESS_TOKEN" \
-d '{
  "description": "Stage Audio Analysis 1733939952_2",
  "public": true,
  "files": {
    "stage_1733939952_2_audio_analysis_backfill.sql": {
      "content": "'"$(sed ':a;N;$!ba;s/"/\\"/g;s/\n/\\n/g' ./1733939952_audio_analysis_backfill.sql)"'"
    }
  }
}' https://api.github.com/gists
```
