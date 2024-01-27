# Audius DDEX Ingester

Indexes and parses new DDEX uploads.

### Local Dev
At the monorepo root:
1. Generate a keyfile for mongo if you have not already:
```
openssl rand -base64 756 > packages/ddex/ingester/mongo-keyfile
chmod 400 packages/ddex/ingester/mongo-keyfile
```
2. Run the services: `docker-compose -f ./dev-tools/compose/docker-compose.ddex.yml --profile ddex up`

If this is your first time running ddex-mongo, you will need to manually initiate the replica set by doing `docker exec -it ddex-mongo mongosh -u mongo -p mongo --authenticationDatabase admin --eval 'rs.initiate({_id:"rs0", members:[{_id:0, host:"ddex-mongo:27017"}]})'`

To access the ddex db via the mongo shell for testing/development, run `docker exec -it ddex-mongo mongosh -u mongo -p mongo --authenticationDatabase admin` then `use ddex`
