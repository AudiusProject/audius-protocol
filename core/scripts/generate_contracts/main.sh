#!/bin/bash

abigen --abi <(jq -c .abi ../packages/libs/data-contracts/ABIs/EntityManager.json) --pkg gen --type EntityManager --out ./contracts/gen/entity_manager.go
