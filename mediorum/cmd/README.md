# TEST

```
cd mediorum/cmd
go test ./reaper -count=1 -timeout 60s -v
```

# PROD

dry run
```
mediorum-cmd reaper -walkDir=/file_storage -logDir=/tmp/reaper_logs
```

delete
```
mediorum-cmd reaper -walkDir=/file_storage -logDir=/tmp/reaper_logs -delete
```
