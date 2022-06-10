### Launch Prometheus & Grafana

```bash
docker-compose up -d prometheus grafana
./grafana/bin/create-data-sources.sh
./grafana/bin/upload-dashboards.sh
```

Prometheus is accessible at port 9090, and Grafana at port 3000

### Deploy Changes

Inside `monitoring-tools repo`
```bash
git checkout master
./deploy.sh
```
