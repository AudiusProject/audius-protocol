# Launch Prometheus & Grafana Locally

## Getting Started

```bash
A run monitoring up

# A run monitoring down
```

Access Grafana by visiting:

* http://${IP}:80

Access Prometheus by visiting:

* http://${IP}:9090/targets

### Notes:

* `https` is not supported.
* The default credentials are `admin`/`admin`.
* The password must be changed on first login to something other than `admin`
  or click on the `Skip` link when prompted to change your password.

If the password is changed, for ease of future development, add the password to your `~/.profile`:

```bash
GRAFANA_PASS=xxxxx

echo "export GRAFANA_PASS=${GRAFANA_PASS}" >> ~/.profile
```

## Prometheus

### Adding New Targets

`./prometheus/generateProm.js` generates `prometheus.yml` within the container at build time.

For local development, start by modifying `./prometheus/ymls/local.yml`.

To add new static targets for production, use the stubs within `./prometheus/ymls/`.

To add new dynamically generated targets, modification of `./prometheus/generateProm.js::generateEnv()` may be required.

### Release Auto-Generated Targets to Production

Deploy production changes by ssh'ing into our monitoring box, checking out the new code, and using `deploy.sh` to generate and consume the production version of `prometheus.yml` which includes targets all staging and production exporters.

```bash
ssh-add ~/.ssh/id_ed25519.github
ssh prometheus-grafana-metrics
cd ~/audius-protocol/monitoring

git checkout master
git pull

scripts/deploy.sh prod
```

This job is also set to run nightly via a `cronjob`:

```
0 0 * * * cd ~/audius-protocol/monitoring && scripts/deploy.sh prod
```

## Grafana

### Adding New Dashboards

Official dashboard names should be prefixed with `Audius - ` while personal dashboards should be prefixed with your name, for example: `Joaquin - `.

Try to keep the number of personal dashboards low to maintain navigability.

Our dashboards use common set of Variables (Dashboard `Settings` -> `Variables`):

* `env`: `label_values(audius_dn_flask_route_latency_seconds_count, environment)`
* `host`: `label_values(audius_dn_flask_route_latency_seconds_count{environment=~"$env"}, host)`

To simplify the process of setting up dashboards each time, we can navigate to the `Audius - Boilerplate` dashboard's `Settings` -> `Save As...` dialog to copy the boilerplate.

Additionally, follow the official documentation for [best practices for creating dashboards](https://grafana.com/docs/grafana/latest/best-practices/best-practices-for-creating-dashboards/).

### Adding New Panels

Plenty of complexity can be added when writing `PromQL`, but most times the following example queries will work for a majority of panels.

However, before writing out PromQL from scratch, it may be easier to find a panel similar to the new panel that will be created, then:

* Click a panel title to open the panel menu
* Hover over `More...`
* Click `Duplicate`

This will create a duplicate panel within your same dashboard.

If the goal is to use a panel from a different dashboard:

* Click on `Copy` instead of `Duplicate` on the source panel
* Navigate to the target dashboard
* Click `Add Panel` (plus symbol on the top-right)
* Click `Paste panel from clipboard`

When additional complexity is required, visit the [official Prometheus documentation on PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/).

#### Common Patterns for Gauges

Gauges are the easiest pattern since they simply display the value of a metric that was displayed at scrape time:

> `audius_dn_health_check_block_difference_current{environment=~"$env", host=~"$host"}`

Notice how we restrict the `environment` and `host` labels associated with the metric to match the Dashboard Variables discussed in the previous section.

**Note:** When using [PromQL filters](https://prometheus.io/docs/prometheus/latest/querying/basics/#time-series-selectors) knowing the intricacies of the label matching operators can save plenty of time:

* `=`: Select labels that are exactly equal to the provided string.
* `!=`: Select labels that are not equal to the provided string.
* `=~`: Select labels that regex-match the provided string.
* `!~`: Select labels that do not regex-match the provided string.

#### Common Patterns for Histograms

A common pattern for histograms is to display the average latency of a recorded metric like the example below:

> `max by (route) (rate(audius_dn_flask_route_latency_seconds_sum{environment=~"$env", host=~"$host"}[5m]) / rate(audius_dn_flask_route_latency_seconds_count{environment=~"$env", host=~"$host"}[5m]))`

The bulk of the query comes from official docs on [calculating averages from histograms](https://prometheus.io/docs/practices/histograms/#count-and-sum-of-observations) while including PromQL filters for `environment` and `host`.

The remaining part of the query, `max by (route) (...)`, uses an [Aggregation Operator](https://prometheus.io/docs/prometheus/latest/querying/operators/#aggregation-operators) which will return the `max` value of the metric after consolidating on the `route` label.

In this specific query, `max by (route)` will display the longest latency across a single `$host`, or all `$host` values if the Dashboard Variable is set to `All`. We use `max` here since it's more important to know that a `route` is being non-performant, regardless of `$host`, since it may be indicative of early warning stress/latency that may soon be appearing on all hosts.

### Configuring Panels
### Saving Dashboards

Modifications to production dashboards are internally tracked by Grafana in case a quick restoration is required:

* Navigate to a dashboard
* Open the Dashboard `Settings` (the cog on the top-right)
* Click on `Versions` (from the left-sidebar)

However, we track our dashboards via `git` as well since this allows us seemless local development of the same dashboards.

#### Saving Locally Developed Dashboards

We can make and save changes to dashboards that were developed on our remote dev boxes by using the following script:

```bash
# pull all dashboards and store them within `grafana/dashboards/`
./grafana/bin/save-dashboards.sh
```

Once locally stored, they can be committed to our repo for a future production release.

#### Saving Production Dashboards

##### Saving Production Dashboards Within `prometheus-grafana-metrics`

When saving production dashboards, everything works out of the box if you ssh into the `prometheus-grafana-metrics` box directly:

```bash
ssh-add ~/.ssh/id_ed25519.github
ssh prometheus-grafana-metrics
cd ~/audius-protocol/monitoring

# pull and sanatize all production dashboards
./grafana/bin/save-dashboards.sh

# open a PR to track changes to our production dashboards
# git checkout -b grafana-$(date "+%F-%H-%M-%S")
# git add grafana/dashboards/

# return to the master branch prior to logging out
# git checkout master
```

##### Saving Production Dashboards Locally

Saving production dashboards locally can also be done by:

* Copying `grafana/bearer.env` from `prometheus-grafana-metrics`
* Copying the `$GRAFANA_PASS` from LastPass

```bash
BEARER_PATH=grafana/bearer.prod.env \
GRAFANA_API_URL=grafana.audius.co \
GRAFANA_PASS=xxx \
./grafana/bin/save-dashboards.sh
```

### Releasing Dashboards to Production

When releasing locally-developed dashboards to Production, ensure we save any manual changes that occurred on our Production dashboards **prior to overwriting them**:

```bash
ssh-add ~/.ssh/id_ed25519.github
ssh prometheus-grafana-metrics
cd ~/audius-protocol/monitoring

# ensure we're on the latest tip of master
git pull

# pull all production dashboards to ensure no manual changes have been made
./grafana/bin/save-dashboards.sh

# open a PR if you see manual changes
# git checkout -b grafana-$(date "+%F-%H-%M-%S")
# git add grafana/dashboards/

# deploy the manual changes seen, as well as the new intended changes
./grafana/bin/upload-dashboards.sh

# return to the master branch prior to logging out
# git checkout master
```

## Notes

Additional notes that may be required when interacting with Prometheus/Grafana.

### SSH Access to `prometheus-grafana-metrics`

A similar setup must exist within your `~/.ssh/config*` settings:

```
Host github.com
  IdentityFile ~/.ssh/id_ed25519.github
```

Once set up, the following line will add your IdentityFile to your current `ssh-agent` session:

```bash
ssh-add ~/.ssh/id_ed25519.github
```

Since `prometheus-grafana-metrics` uses `ForwardAgent yes` we will be able to use our ssh key for interacting with `git`.
