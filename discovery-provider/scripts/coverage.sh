#!/bin/bash

# Remove previous run coverage artifacts 
rm -rf cov_html
rm .coverage

# Run code coverage
py.test --cov=src tests --cov-report html:cov_html

# Open entrypoint
open cov_html/index.html
