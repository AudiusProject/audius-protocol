#!/bin/bash

/usr/bin/wait

node build/src/index.js | tee >(logger)
