#!/bin/bash

# Simple test script to ping local endpoint
curl -X GET \
  http://localhost:5000/users

curl -X GET \
  http://localhost:5000/tracks
