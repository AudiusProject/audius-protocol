# Generate a vector.toml
cat <<-EOF > $PWD/vector.toml
[api]
enabled = true
address = "0.0.0.0:8686"

[sources.docker]
type = "docker_logs"
docker_host = "/var/run/docker.sock"
include_containers = [ "audius/" ]

[sinks.axiom]
type = "axiom"
inputs = [ "docker" ]
token = $audius_axiom_token
dataset = "vector.dev"
url = "https://cloud.axiom.co"
org_id = "audius-Lu52"

[sinks.out]
inputs = [ "docker" ]
type = "console"
encoding.codec = "json"
EOF

# Launch vector
sleep infinity
