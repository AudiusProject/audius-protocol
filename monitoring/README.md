# Audius Network Monitoring
### Launch Grafana

```bash
docker-compose up -d grafana prometheus
./grafana/bin/create-data-sources.sh
./grafana/bin/upload-dashboards.sh
```

Visit `http://${REMOTE_DEV_HOST}:3000`.

### Deploy Changes

```bash
ssh prometheus-grafana-metrics
cd ~/audius-protocol/monitoring
git checkout master
./deploy.sh
```
