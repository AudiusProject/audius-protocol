# Track

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Artwork** | Pointer to [**TrackArtwork**](TrackArtwork.md) |  | [optional] 
**Description** | Pointer to **string** |  | [optional] 
**Genre** | Pointer to **string** |  | [optional] 
**Id** | **string** |  | 
**TrackCid** | Pointer to **string** |  | [optional] 
**Mood** | Pointer to **string** |  | [optional] 
**ReleaseDate** | Pointer to **string** |  | [optional] 
**RemixOf** | Pointer to [**RemixParent**](RemixParent.md) |  | [optional] 
**RepostCount** | **int32** |  | 
**FavoriteCount** | **int32** |  | 
**Tags** | Pointer to **string** |  | [optional] 
**Title** | **string** |  | 
**User** | [**User**](User.md) |  | 
**Duration** | **int32** |  | 
**Downloadable** | Pointer to **bool** |  | [optional] 
**PlayCount** | **int32** |  | 
**Permalink** | Pointer to **string** |  | [optional] 
**IsStreamable** | Pointer to **bool** |  | [optional] 

## Methods

### NewTrack

`func NewTrack(id string, repostCount int32, favoriteCount int32, title string, user User, duration int32, playCount int32, ) *Track`

NewTrack instantiates a new Track object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewTrackWithDefaults

`func NewTrackWithDefaults() *Track`

NewTrackWithDefaults instantiates a new Track object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetArtwork

`func (o *Track) GetArtwork() TrackArtwork`

GetArtwork returns the Artwork field if non-nil, zero value otherwise.

### GetArtworkOk

`func (o *Track) GetArtworkOk() (*TrackArtwork, bool)`

GetArtworkOk returns a tuple with the Artwork field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetArtwork

`func (o *Track) SetArtwork(v TrackArtwork)`

SetArtwork sets Artwork field to given value.

### HasArtwork

`func (o *Track) HasArtwork() bool`

HasArtwork returns a boolean if a field has been set.

### GetDescription

`func (o *Track) GetDescription() string`

GetDescription returns the Description field if non-nil, zero value otherwise.

### GetDescriptionOk

`func (o *Track) GetDescriptionOk() (*string, bool)`

GetDescriptionOk returns a tuple with the Description field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDescription

`func (o *Track) SetDescription(v string)`

SetDescription sets Description field to given value.

### HasDescription

`func (o *Track) HasDescription() bool`

HasDescription returns a boolean if a field has been set.

### GetGenre

`func (o *Track) GetGenre() string`

GetGenre returns the Genre field if non-nil, zero value otherwise.

### GetGenreOk

`func (o *Track) GetGenreOk() (*string, bool)`

GetGenreOk returns a tuple with the Genre field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetGenre

`func (o *Track) SetGenre(v string)`

SetGenre sets Genre field to given value.

### HasGenre

`func (o *Track) HasGenre() bool`

HasGenre returns a boolean if a field has been set.

### GetId

`func (o *Track) GetId() string`

GetId returns the Id field if non-nil, zero value otherwise.

### GetIdOk

`func (o *Track) GetIdOk() (*string, bool)`

GetIdOk returns a tuple with the Id field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetId

`func (o *Track) SetId(v string)`

SetId sets Id field to given value.


### GetTrackCid

`func (o *Track) GetTrackCid() string`

GetTrackCid returns the TrackCid field if non-nil, zero value otherwise.

### GetTrackCidOk

`func (o *Track) GetTrackCidOk() (*string, bool)`

GetTrackCidOk returns a tuple with the TrackCid field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTrackCid

`func (o *Track) SetTrackCid(v string)`

SetTrackCid sets TrackCid field to given value.

### HasTrackCid

`func (o *Track) HasTrackCid() bool`

HasTrackCid returns a boolean if a field has been set.

### GetMood

`func (o *Track) GetMood() string`

GetMood returns the Mood field if non-nil, zero value otherwise.

### GetMoodOk

`func (o *Track) GetMoodOk() (*string, bool)`

GetMoodOk returns a tuple with the Mood field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetMood

`func (o *Track) SetMood(v string)`

SetMood sets Mood field to given value.

### HasMood

`func (o *Track) HasMood() bool`

HasMood returns a boolean if a field has been set.

### GetReleaseDate

`func (o *Track) GetReleaseDate() string`

GetReleaseDate returns the ReleaseDate field if non-nil, zero value otherwise.

### GetReleaseDateOk

`func (o *Track) GetReleaseDateOk() (*string, bool)`

GetReleaseDateOk returns a tuple with the ReleaseDate field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetReleaseDate

`func (o *Track) SetReleaseDate(v string)`

SetReleaseDate sets ReleaseDate field to given value.

### HasReleaseDate

`func (o *Track) HasReleaseDate() bool`

HasReleaseDate returns a boolean if a field has been set.

### GetRemixOf

`func (o *Track) GetRemixOf() RemixParent`

GetRemixOf returns the RemixOf field if non-nil, zero value otherwise.

### GetRemixOfOk

`func (o *Track) GetRemixOfOk() (*RemixParent, bool)`

GetRemixOfOk returns a tuple with the RemixOf field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetRemixOf

`func (o *Track) SetRemixOf(v RemixParent)`

SetRemixOf sets RemixOf field to given value.

### HasRemixOf

`func (o *Track) HasRemixOf() bool`

HasRemixOf returns a boolean if a field has been set.

### GetRepostCount

`func (o *Track) GetRepostCount() int32`

GetRepostCount returns the RepostCount field if non-nil, zero value otherwise.

### GetRepostCountOk

`func (o *Track) GetRepostCountOk() (*int32, bool)`

GetRepostCountOk returns a tuple with the RepostCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetRepostCount

`func (o *Track) SetRepostCount(v int32)`

SetRepostCount sets RepostCount field to given value.


### GetFavoriteCount

`func (o *Track) GetFavoriteCount() int32`

GetFavoriteCount returns the FavoriteCount field if non-nil, zero value otherwise.

### GetFavoriteCountOk

`func (o *Track) GetFavoriteCountOk() (*int32, bool)`

GetFavoriteCountOk returns a tuple with the FavoriteCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetFavoriteCount

`func (o *Track) SetFavoriteCount(v int32)`

SetFavoriteCount sets FavoriteCount field to given value.


### GetTags

`func (o *Track) GetTags() string`

GetTags returns the Tags field if non-nil, zero value otherwise.

### GetTagsOk

`func (o *Track) GetTagsOk() (*string, bool)`

GetTagsOk returns a tuple with the Tags field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTags

`func (o *Track) SetTags(v string)`

SetTags sets Tags field to given value.

### HasTags

`func (o *Track) HasTags() bool`

HasTags returns a boolean if a field has been set.

### GetTitle

`func (o *Track) GetTitle() string`

GetTitle returns the Title field if non-nil, zero value otherwise.

### GetTitleOk

`func (o *Track) GetTitleOk() (*string, bool)`

GetTitleOk returns a tuple with the Title field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTitle

`func (o *Track) SetTitle(v string)`

SetTitle sets Title field to given value.


### GetUser

`func (o *Track) GetUser() User`

GetUser returns the User field if non-nil, zero value otherwise.

### GetUserOk

`func (o *Track) GetUserOk() (*User, bool)`

GetUserOk returns a tuple with the User field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetUser

`func (o *Track) SetUser(v User)`

SetUser sets User field to given value.


### GetDuration

`func (o *Track) GetDuration() int32`

GetDuration returns the Duration field if non-nil, zero value otherwise.

### GetDurationOk

`func (o *Track) GetDurationOk() (*int32, bool)`

GetDurationOk returns a tuple with the Duration field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDuration

`func (o *Track) SetDuration(v int32)`

SetDuration sets Duration field to given value.


### GetDownloadable

`func (o *Track) GetDownloadable() bool`

GetDownloadable returns the Downloadable field if non-nil, zero value otherwise.

### GetDownloadableOk

`func (o *Track) GetDownloadableOk() (*bool, bool)`

GetDownloadableOk returns a tuple with the Downloadable field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDownloadable

`func (o *Track) SetDownloadable(v bool)`

SetDownloadable sets Downloadable field to given value.

### HasDownloadable

`func (o *Track) HasDownloadable() bool`

HasDownloadable returns a boolean if a field has been set.

### GetPlayCount

`func (o *Track) GetPlayCount() int32`

GetPlayCount returns the PlayCount field if non-nil, zero value otherwise.

### GetPlayCountOk

`func (o *Track) GetPlayCountOk() (*int32, bool)`

GetPlayCountOk returns a tuple with the PlayCount field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetPlayCount

`func (o *Track) SetPlayCount(v int32)`

SetPlayCount sets PlayCount field to given value.


### GetPermalink

`func (o *Track) GetPermalink() string`

GetPermalink returns the Permalink field if non-nil, zero value otherwise.

### GetPermalinkOk

`func (o *Track) GetPermalinkOk() (*string, bool)`

GetPermalinkOk returns a tuple with the Permalink field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetPermalink

`func (o *Track) SetPermalink(v string)`

SetPermalink sets Permalink field to given value.

### HasPermalink

`func (o *Track) HasPermalink() bool`

HasPermalink returns a boolean if a field has been set.

### GetIsStreamable

`func (o *Track) GetIsStreamable() bool`

GetIsStreamable returns the IsStreamable field if non-nil, zero value otherwise.

### GetIsStreamableOk

`func (o *Track) GetIsStreamableOk() (*bool, bool)`

GetIsStreamableOk returns a tuple with the IsStreamable field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetIsStreamable

`func (o *Track) SetIsStreamable(v bool)`

SetIsStreamable sets IsStreamable field to given value.

### HasIsStreamable

`func (o *Track) HasIsStreamable() bool`

HasIsStreamable returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


