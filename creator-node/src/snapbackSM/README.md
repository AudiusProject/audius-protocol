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
    - If replica sets are healthy, perform sync if necessary by checking if:
        - Secondaries are up to date with primaries
        - If there is not already a sync job enqueued
    - Else if not healthy, reassigning different replica sets to users

`syncHistoryAggregator.js`
- Records the number of sync fails and successes triggered on the current Content Node in redis
- Records the date of the most recent sync fail and success on the current Content Node in redis
- Returns the number of sync fails and successes triggered on the current Content Node
- Returns the date of the most recent sync fail and success on the current Content Node

### TODO:
- [ ] Break `snapbackSM.js` into smaller classes
- [ ] Add more logic to make syncs more robust
    - More health check logic
    - Have snapback be able to handle edge cases