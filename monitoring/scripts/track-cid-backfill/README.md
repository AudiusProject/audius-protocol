

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

combine csvs in to one mega csv

create discovery based on Michelle's PR
* load csv (napkin math, how big should this file is?)
* for trackId row, update the copy320 column with the copy320 value from the csv


---------

TODO afterward

* Update trusted notifier to send copy320 CID to content node blacklist
    * 
* confirm Saliou's indexing copy320 changes are live and that the copy320 is exposed
* Have clients use the new stream route

* Remove old route and all legacy trackId stuff

    
# Queries

- [_] getAllContentNodes
- [_] getTrackCountByEndpoint
    * just is_current
    * get trackBlockchainId from 'tracks'
- [_] getTrackIdBatch