
### Launch Grafana

```bash
docker-compose up -d grafana prometheus
./grafana/bin/create-data-sources.sh
./grafana/bin/upload-dashboards.sh
```

Visit `http://${REMOTE_DEV_HOST}:3000`.