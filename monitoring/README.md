### Launch Prometheus & Grafana Locally

```bash
docker-compose build
docker-compose up -d prometheus grafana
./grafana/bin/create-data-sources.sh
./grafana/bin/upload-dashboards.sh
```

Ports:

* Prometheus binds to :9090
* Grafana binds to :3000

### Deploy Production Changes

```bash
ssh prometheus-grafana-metrics
cd ~/audius-protocol/monitoring
git checkout master

./deploy.sh
```
