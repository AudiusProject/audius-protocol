
# Monitoring 

This is demoing locally. Eventually this folder should go away or be made much better


# Run

Start the storage stack
```
make dev.storage
```

Start the monitoring stack
```
cd monitoring
docker-compose up
```

# Viewing Metrics

For prometheus go to `localhost:9090`

For grafana go to `localhost:3000` 

grafana username: admin
grafana password: admin

---------------

Add a Prometheus data source with the following parameters:
* Name:  NATS-Prometheus
* Type:  Prometheus
* Url:  `http://<CONTAINER ID>:9090` (default, unless changed above)

Leave the rest as defaults.

Next import the NATS dashboard, `grafana-nats-dash.json` into Grafana, and associate the
Prometheus datasource you just created.  You should start seeing data graph as follows (note that
selecting a view of the last five minutes will be more exciting).

Experiment running benchmarks and applications and you'll see a dashboard like the one below!

If you're using JetStream, you can import the JetStream dashboard (`grafana-jetstream-dash.json`) too:
