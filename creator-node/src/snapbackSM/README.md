# Snapback State Manager (SnapbackSM)

To ensure user data is present, we must have some sort of data redundancy across the protocol. Snapback State Manager (SnapbackSM) is the Content Node class that handles data redundancy through sync operations. 

## Directory Details

`snapbackSM.js`
- Initiates the bull queues `stateMachineQueue`, `manualSyncQueue`, and `recurringSyncQueue` that process sync jobs. 
    - `stateMachineQueue`: structured to re-add a job to the recurring queue on an on-going, recurring basis
    - `manualSyncQueue`: processes sync jobs triggered by client actions
    - `recurringSyncQueue`: processes sync jobs added on a recurring basis
- For recurring jobs, also determines if a sync is necessary by:
    - Fetching all users with current node as part of replica set
    - Slicing a subset of users from all users
    - Determining if nodes in replica set are healthy
    - If replica sets are healthy, enqueue a sync job when necessary by checking if:
        - Secondaries are up to date with primaries
        - If there is not already a sync job enqueued
    - Else if not healthy, reassigning different replica sets to users with these cases:
        - if one secondary is unhealthy -> issue new secondary
        - if two secondaries are unhealthy -> issue two new secondaries
        - (*) if one primary is unhealthy -> issue secondary with higher clock value as new primary, and two new secondaries
        - (*) if one primary and one secondary are unhealthy -> issue healthy secondary as primary, and two new secondaries
        - if entire replica set is unhealthy -> for now, ignore
    
    (*) - if the primary fails the health check up to a max threshold of visits, mark as healthy for the time being and do not issue a reconfig. Once the threshold is surpassed, mark as unhealthy and issue the proper reconfig.


`syncHistoryAggregator.js`
- Records the number of sync fails and successes triggered on the current Content Node in redis
- Records the date of the most recent sync fail and success on the current Content Node in redis
- Returns the number of sync fails and successes triggered on the current Content Node
- Returns the date of the most recent sync fail and success on the current Content Node

`peerSetManager.js`
- Fetches all users with the node in their replica sets
- Queries the health check route for any peer and determines whether or not a peer is healthy
- Creates a mapping of peer to its spId
- Tracks the number of times a primary has failed its health check route
- Contains helper functions to build proper data structures for `snapbackSM.js`

### TODO:
- [x] Break `snapbackSM.js` into smaller classes
- [x] Add more logic to make syncs more robust
    - More health check logic
    - Have snapback be able to handle edge cases