### Launch Prometheus & Grafana Locally

```bash
A run monitoring up

# A run monitoring down
```

Access Grafana by visiting:

* http://${IP}:80

Access Prometheus by visiting:

* http://${IP}:9090/targets

#### Notes:

* `https` is not supported.
* The default credentials are `admin`/`admin`.
* The password must be changed on first login to something other than `admin`
  or click on the `Skip` link when prompted to change your password.

If the password is changed, for ease of future development, add the password to your
`~/.profile`:

```bash
GRAFANA_PASS=xxxxx

echo "export GRAFANA_PASS=${GRAFANA_PASS}" >> ~/.profile
```

### Adding New Targets

`./prometheus/generateProm.js` generates `prometheus.yml` within the
container at build time.

For local development, start by modifying
`./prometheus/ymls/local.yml`.

To add new static targets for production, use the stubs within
`./prometheus/ymls/`.

To add new dynamically generated targets, modification of
`./prometheus/generateProm.js::generateEnv()` may be required.

### Deploy Production Changes

```bash
ssh prometheus-grafana-metrics
cd ~/audius-protocol/monitoring

git checkout master
git pull

scripts/deploy.sh prod
```
