

# Goal 

Build a mapping of trackBlockchainId,copy320

# To Run

Run the script to fetch the trackid to cid mapping run
```
npm run start
```

to run the python script to combine the csvs into one mega-csv for the migration, run
```
cd python && pipenv run python3 main.py
```

# Steps

* get all content nodes
* get all trackIds from discovery

for trackIdBatch in trackIds:
    for cnode in cnode:
        send the request
        save to new csv

* combine csvs in to one mega csv
* run migration against discovery DB

# Queries

- [_] getAllContentNodes
- [_] getTrackCountByEndpoint
    * just is_current
    * get trackBlockchainId from 'tracks'
- [_] getTrackIdBatch