
# Telemetry 

There are 3 types of telemetry collected using this package
* Logs
* Traces
* Metrics

### Logs

Logs are for our completely unstructured data set to stdout. 

Currently we use `zerolog` to create new logs

### Traces

Traces are a superset of logs that contain links between traces so a graph of dataflow can be created.

Open Telemetry is the tracing standard used for exposing trace data. 
Traces are currently only sent to stdout but will eventually be sent to out trace [collector](https://opentelemetry.io/docs/collector/)

### Metrics

Metrics are the most structured form of telemetry collected.

Metrics are exposed via Prometheus and visualized with Grafana