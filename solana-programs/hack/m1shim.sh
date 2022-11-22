#!/usr/bin/env bash

# set -e

# simulate a named pipe [https://en.wikipedia.org/wiki/Named_pipe]
# note that due to darwin/linux incompatibility we cannot use a `mkfifo` pipe

function write_to_pipe {
    echo "$@" >> /hostpipe.txt
}

function cargo {
    write_to_pipe cargo "$@"
}

function solana {
    write_to_pipe solana "$@"
}

function solana-keygen {
    write_to_pipe solana-keygen "$@"
}

function anchor {
    write_to_pipe anchor "$@"
}
