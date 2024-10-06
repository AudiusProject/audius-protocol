# TEST

```
cd mediorum
make pg.up
cd cmd
go test ./segments -count=1 -timeout 60s -v
```

# PROD

dry run
```
mediorum-cmd segments
```

delete
```
mediorum-cmd segments --delete
```
