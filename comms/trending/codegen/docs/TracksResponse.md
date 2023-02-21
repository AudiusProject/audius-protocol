# TracksResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Data** | Pointer to [**[]Track**](Track.md) |  | [optional] 

## Methods

### NewTracksResponse

`func NewTracksResponse() *TracksResponse`

NewTracksResponse instantiates a new TracksResponse object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewTracksResponseWithDefaults

`func NewTracksResponseWithDefaults() *TracksResponse`

NewTracksResponseWithDefaults instantiates a new TracksResponse object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetData

`func (o *TracksResponse) GetData() []Track`

GetData returns the Data field if non-nil, zero value otherwise.

### GetDataOk

`func (o *TracksResponse) GetDataOk() (*[]Track, bool)`

GetDataOk returns a tuple with the Data field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetData

`func (o *TracksResponse) SetData(v []Track)`

SetData sets Data field to given value.

### HasData

`func (o *TracksResponse) HasData() bool`

HasData returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


