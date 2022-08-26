#!/bin/bash

/usr/bin/wait

node src/index.js | tee >(logger)
