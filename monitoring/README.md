### Launch Prometheus & Grafana Locally

```bash
A run monitoring up

A run monitoring down
```

Ports:

* Prometheus binds to :9090
* Grafana binds to :3000

### Deploy Production Changes

```bash
ssh prometheus-grafana-metrics
cd ~/audius-protocol/monitoring

git checkout master
git pull

./deploy.sh prod
```
