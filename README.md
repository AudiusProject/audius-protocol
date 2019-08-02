<img src="https://user-images.githubusercontent.com/2731362/62400456-224e6280-b534-11e9-82c4-3b04175d4e01.png" alt="drawing" width="400"/>

Audius frontend gateway for proxying traffic 

```
git clone git@github.com:AudiusProject/general-admission.git
cd general-admission

cp .env.staging .env # or .env.production

docker-compose up --build
```

visit http://localhost:9000.

and to stop it:

```
docker-compose down
```

or if you want to run just the node service:

```
npm run start

# or with docker

docker build -t ga-node .
docker run --rm ga-node -p 8000:8000 -d
```