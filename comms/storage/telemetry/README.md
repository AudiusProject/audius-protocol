
# Telemetry 

There are 2 types of telemetry collected using this package
* Logs
* Metrics

### Logs

Logs are for our completely unstructured data set to stdout. 

Currently we use `slog` to create new logs

### Metrics

Metrics are the most structured form of telemetry collected.

Metrics are exposed via Prometheus and visualized with Grafana