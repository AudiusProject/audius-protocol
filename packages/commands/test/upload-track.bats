#!/usr/bin/env bats

setup_file() {
    load 'common-setup'
    _common_setup

    export TEST_HANDLE="test_$RANDOM"
    timeout 120s npm run audius-cmd -- user create "$TEST_HANDLE"
}

setup() {
    load 'common-setup'
    _common_setup
}

@test "should upload random track when called without args" {
    run timeout 120s npm run audius-cmd -- track upload --from "$TEST_HANDLE"

    assert_success
    assert_line "Successfully uploaded track!"
}
