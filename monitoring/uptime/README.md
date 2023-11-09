# Uptime Monitor

Golang service that queries the status of each node once per hour and records the results in an embedded KV store (bbolt).  

Requires /bolt directory, which is mounted in audius-docker-compose.  

* Environment must have either `audius_discprov_env` or `MEDIORUM_ENV` set to `stage` or `prod`.
* Other services (Content Nodes, Discovery Nodes, protocol dashboards) access through echo server routes, not directly through bolt.
