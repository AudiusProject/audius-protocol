# Activity

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Timestamp** | Pointer to **string** |  | [optional] 
**ItemType** | Pointer to **map[string]interface{}** |  | [optional] 
**Item** | Pointer to **map[string]interface{}** |  | [optional] 

## Methods

### NewActivity

`func NewActivity() *Activity`

NewActivity instantiates a new Activity object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewActivityWithDefaults

`func NewActivityWithDefaults() *Activity`

NewActivityWithDefaults instantiates a new Activity object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetTimestamp

`func (o *Activity) GetTimestamp() string`

GetTimestamp returns the Timestamp field if non-nil, zero value otherwise.

### GetTimestampOk

`func (o *Activity) GetTimestampOk() (*string, bool)`

GetTimestampOk returns a tuple with the Timestamp field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTimestamp

`func (o *Activity) SetTimestamp(v string)`

SetTimestamp sets Timestamp field to given value.

### HasTimestamp

`func (o *Activity) HasTimestamp() bool`

HasTimestamp returns a boolean if a field has been set.

### GetItemType

`func (o *Activity) GetItemType() map[string]interface{}`

GetItemType returns the ItemType field if non-nil, zero value otherwise.

### GetItemTypeOk

`func (o *Activity) GetItemTypeOk() (*map[string]interface{}, bool)`

GetItemTypeOk returns a tuple with the ItemType field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetItemType

`func (o *Activity) SetItemType(v map[string]interface{})`

SetItemType sets ItemType field to given value.

### HasItemType

`func (o *Activity) HasItemType() bool`

HasItemType returns a boolean if a field has been set.

### GetItem

`func (o *Activity) GetItem() map[string]interface{}`

GetItem returns the Item field if non-nil, zero value otherwise.

### GetItemOk

`func (o *Activity) GetItemOk() (*map[string]interface{}, bool)`

GetItemOk returns a tuple with the Item field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetItem

`func (o *Activity) SetItem(v map[string]interface{})`

SetItem sets Item field to given value.

### HasItem

`func (o *Activity) HasItem() bool`

HasItem returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


