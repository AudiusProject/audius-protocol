# Notifications

## What does it do?
The `NotificationProcessor` runs a job queue backed by redis that processes the 
incoming notifications, stores the notification information in the postgres db, and sends out 
push notifications upon processing and email notifications on an hourly basis. 

## How does it work?
### Job Queue
[Bull](https://github.com/OptimalBits/bull#readme) A redis based queue is used to process the following notification jobs:
* `notification-queue` - The queue of jobs for fetching notifications from discprov, adding the notifications to 
the DB, and sending push notifications. This runs on a continuous basis fetching more notifications based on the 
last block number parsed.
* `email-queue` - A cron job that runs every hour to send out email notifications to users at midnight (in their timezone)
* `announcement-queue` - A jobs that runs every 30 seconds to check for new announcements to be sent as push notifications. 


### Database
[Postgres](https://www.postgresql.org/) The storage database with the following tables
#### Notifications

| Field       | Type    | Description                                       |
| :---------- | :------ | :------------------------------------------------ |
| id          | uuid    | Unique identifier                                 |
| type        | enum    | The type of notification. See reference below     |
| isRead      | boolean | If the notification is marked read by the user    |
| isHidden    | boolean | If the notification is marked hidden by the user  |
| isViewed    | boolean | If the notification is viewed by the user         |
| userId      | integer | The id of the user who the notification is for    |
| entityId    | integer | Id of track/album/track/user depends on the type* |
| blocknumber | integer | The blocknumber the notification action happened  |
| timestamp   | date    | When the notification was created                 |

```
## Reference
type enum values = 
  | 'Follow'
  | 'RepostTrack'
  | 'RepostPlaylist'
  | 'RepostAlbum'
  | 'FavoriteTrack'
  | 'FavoritePlaylist'
  | 'FavoriteAlbum'
  | 'CreateTrack'
  | 'CreatePlaylist'
  | 'CreateAlbum'
  | 'Announcement'
  | 'MilestoneListen'
  | 'MilestoneRepost'
  | 'MilestoneFavorite'
  | 'MilestoneFollow'
  | 'RemixCreate'
  | 'RemixCosign'
  | 'TrendingTrack'
```
\* ___Note that the entityId will vary based on the notification. To be explained in the notification types section___

#### NotificationActions
The notification actions table is used to attach additional information to a single notification. 
The primary use case is for notifications w/ grouping. See examples in Notification Types. 

| Field            | Type       | Description                                           |
| :--------------- | :--------- | :---------------------------------------------------- |
| id               | uuid       |                                                       |
| notificationId   | foreignKey | References the id of the notification table           |
| actionEntityType | text       | The type of the action entity: track/album/track/user |
| actionEntityId   | integer    | Id of track/album/track/user depends on the type*     |
| blocknumber      | integer    | The blocknumber the notification action happened      |

* ___Note that the entityId will vary based on the notification___


### Notification Types
Note: Many of the actions below group notifications together: meaning that until the notification
is marked as viewed, the notification actions will be stacked on that notification.  
ie. In the follow case below, if many users follow user U1 then it will only cause more notification 
actions to be created referencing the single notification row. When user U1 views the notification, 
a new notification row will be created and notification actions will then use that until it is viewed. 

**Follow**  
Scenario: User U1 and U2 follows user U3  
DB Entries
* Notification - userId: U3, entityId: U3, type: 'Follow'
  * NotificationAction - actionEntityType: 'user', entityId: U1  
  * NotificationAction - actionEntityType: 'user', entityId: U2  

Note if user U3 checks the notification after U1 follows and before U2 follows, then 
two notification db entries will be created w/ the new U2 follow referencing the new 
notification. 

**Repost (Track/Playlist/Album)**  
Scenario: User U1 and U2 repost Track T1 owned by U3
DB Entries
* Notification - userId: U3, entityId: T1, type: 'RepostTrack'
  * NotificationAction - actionEntityType: 'user', entityId: U1  
  * NotificationAction - actionEntityType: 'user', entityId: U2  

Note: if user U3 checks the notification after U1 reposts and before U3 reposts, then 
two notification db entries will be created w/ the new U2 repost referencing the new 
notification.  
Note: The pattern is the same for tracks/playlists/album with the only difference being 
the notification type field being 'RepostTrack', 'RepostPlaylist', 'RepostAlbum'

**Favorite (Track/Playlist/Album)**  
Scenario: User U1 and U2 favorite Playlist P1 owned by U3  
DB Entries
* Notification - userId: U3, entityId: P1, type: 'FavoritePlaylist'
  * NotificationAction - actionEntityType: 'user', entityId: U1  
  * NotificationAction - actionEntityType: 'user', entityId: U2  

Note if user U3 checks the notification after U1 favorites and before U2 favorites, then 
two notification db entries will be created w/ the new U2 favorite referencing the new 
notification.  
Note: The pattern is the same for tracks/playlists/album with the only difference being 
the notification type field being 'FavoriteTrack', 'FavoritePlaylist', 'FavoriteAlbum'

**Create (Track/Playlist/Album)**  
Scenario: User U1 and U2 subscribe to user U3 and U3 uploads a public Track T1  
DB Entries
* Notification - userId: U1, entityId: U3, type: 'CreateTrack'
  * NotificationAction - actionEntityType: 'track', entityId: T1  
* Notification - userId: U2, entityId: P1, type: 'CreateTrack'
  * NotificationAction - actionEntityType: 'track', entityId: T1  

Scenario: User U1 subscribes to user U3 and U3 uploads a public Playlist P1  
DB Entries
* Notification - userId: U1, entityId: P1, type: 'CreatePlaylist'
  * NotificationAction - actionEntityType: 'playlist', entityId: U3  

Note: The pattern for create playlist and album are the same for with the only difference being 
the notification type field 'CreatePlaylist', 'CreateAlbum'  
Note: The reason track creation notifications are different from playlist/album notifications 
is because tracks can be grouped together, but playlist/album creation cannot be.  

**Announcement**  
Scenario: New product feature notification to be sent to all users.  
Announcements are not put into the notifications table until after they 
have been viewed or read by the user. New announcements are created by uploading correctly formatted 
json files to aws s3 and making a post request to `/announcements` so that the server re-fetches 
the json files from s3 and reloads them. 

TODO: Fill out information about the flow & script to automate the process. 

**Milestone**  
TODO: Fill in this section. 
Note: Milestones use a different flow from the other notifications.

**TrendingTrack**  
Scenario: User U1 posts track T1 which breaking into the top 10 weekly trending tracks as number 3  
DB Entries
* Notification - userId: U1, entityId: T1, type: 'TrendingTrack'
  * NotificationAction - actionEntityType: 'weekly-all', entityId: 3

A notification is only created if the track is in the top 10 trending list. 
These notifications do not stack meaning a new notification with be created if the track moves up 
the trending list. 
If a track in the same genre already has a notification and 6 hours has passed and it has moved up the 
trending list, then another notification is created.  

**RemixCreate**  
Scenario: User U1 uploads track T1 that remixes track T2 owned by user U2  
DB Entries
* Notification - userId: U2, entityId: T1, type: 'RemixCreate'
  * NotificationAction - actionEntityType: 'track', entityId: T2  

Note: RemixCreate notifications do not stack. The means that if multiple users remix the same 
track, the original artist will not receive a single notifications will all of the remix, instead
it will be multiple individual notifications.

**RemixCosign**  
Scenario: User U1 owns track T1 that remixes track T2 owned by user U2 and U2 cosigns T1  
DB Entries
* Notification - userId: U1, entityId: T1, type: 'CosignTrack'
  * NotificationAction - actionEntityType: 'user', entityId: U2  

Note: RemixCosign notifications do not stack. The means that if a track remixes multiple other tracks
and the original artist of those tracks cosign the remix, the remix upload user will not receive a 
single notifications will all of the remix cosigned, but instead get multiple individual notifications.
