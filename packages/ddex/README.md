# Audius DDEX

Ingests, parses, and uploads DDEX uploads.

## Local Dev
DDEX requires these services: `ddex-webapp`, `ddex-crawler`, `ddex-indexer`, `ddex-parser`, `ddex-publisher`, `ddex-mongo`.

### Setup
1. (At the monorepo root) Generate a keyfile for mongo:
```
openssl rand -base64 756 > packages/ddex/mongo-keyfile
chmod 400 packages/ddex/mongo-keyfile
```
2. `audius-compose connect` to update your /etc/hosts
3. `audius-compose up --ddex`
4. Once the `ddex-mongo` container is running: manually intiate the mongodb replica set with `docker exec -it ddex-mongo mongosh -u mongo -p mongo --authenticationDatabase admin --eval 'rs.initiate({_id:"rs0", members:[{_id:0, host:"ddex-mongo:27017"}]})`. The other ddex containers will be blocked from starting until this command succeeds.

### Bring up the ddex stack subsequently
`audius-compose up --ddex`
Note: `audius-compose down` removes the `ddex-mongo-db` volume, so if you run this, you will need to initiate the mongodb replica set again the next time you bring up the `ddex-mongo` container. See step 4 in the Setup section above.

To access the ddex db via the mongo shell: `docker exec -it ddex-mongo mongosh -u mongo -p mongo --authenticationDatabase admin` then `use ddex`

### Develop with hot reloading
Each service can be run independently as long as `ddex-mongo` is up. See the respective subdirectories' READMEs.
