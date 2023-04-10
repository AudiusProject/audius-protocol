#!/usr/bin/env bats

setup() {
    load 'common-setup'
    _common_setup
}

@test "should follow specified user" {
    export TEST_HANDLE_1="test-user-handle-$RANDOM"
    timeout 60s npm exec audius-cmd create-user "$TEST_HANDLE_1"
    export TEST_HANDLE_2="test-user-handle-$RANDOM"
    timeout 60s npm exec audius-cmd create-user "$TEST_HANDLE_2"

    run timeout 60s npm exec audius-cmd follow --from "$TEST_HANDLE_1" "@$TEST_HANDLE_2"

    assert_success
    assert_line "Successfully followed user!"
}
