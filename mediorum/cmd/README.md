cd mediorum/cmd
go test ./reaper -count=1 -timeout 60s -v

cp -r ./cmd/reaper/fixtures/ /tmp/reaper
