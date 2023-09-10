# Audius Embed Player

Like you've seen on [twitter](https://twitter.com/AudiusProject/status/1293624808459010050).


## Running
```
# Run against a local [General Admission](https://github.com/AudiusProject/general-admission) server
npm run start:dev

# Run against staging Audius services
npm run start:stage

# Run against production Audius services
npm run start:prod


## Deploying

Deployed via CI

```
npx wrangler publish --env staging
```
