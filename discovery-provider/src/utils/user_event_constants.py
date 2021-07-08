# Source of truth for events emitted by the User contract

# Lookup from property to event name from the User contract
user_event_types_lookup = {
    "add_user": "AddUser",
    "update_multihash": "UpdateMultihash",
    "update_name": "UpdateName",
    "update_location": "UpdateLocation",
    "update_bio": "UpdateBio",
    "update_profile_photo": "UpdateProfilePhoto",
    "update_cover_photo": "UpdateCoverPhoto",
    "update_is_creator": "UpdateIsCreator",
    "update_is_verified": "UpdateIsVerified",
    "update_creator_node_endpoint": "UpdateCreatorNodeEndpoint",
}

# Array version of lookup with event names from the User contract
user_event_types_arr = [
    user_event_types_lookup["add_user"],
    user_event_types_lookup["update_multihash"],
    user_event_types_lookup["update_name"],
    user_event_types_lookup["update_location"],
    user_event_types_lookup["update_bio"],
    user_event_types_lookup["update_profile_photo"],
    user_event_types_lookup["update_cover_photo"],
    user_event_types_lookup["update_is_creator"],
    user_event_types_lookup["update_is_verified"],
    user_event_types_lookup["update_creator_node_endpoint"],
]

user_replica_set_manager_event_types_lookup = {
    "update_replica_set": "UpdateReplicaSet",
    "add_or_update_content_node": "AddOrUpdateContentNode",
}

user_replica_set_manager_event_types_arr = [
    user_replica_set_manager_event_types_lookup["update_replica_set"],
    user_replica_set_manager_event_types_lookup["add_or_update_content_node"],
]
