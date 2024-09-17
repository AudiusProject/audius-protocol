-- name: GetTx :one
select * from core_tx_results where lower(tx_hash) = lower($1) limit 1;

-- name: TotalTxResults :one
select count(tx_hash) from core_tx_results;

-- name: GetLatestAppState :one
select block_height, app_hash
from core_app_state
order by block_height desc
limit 1;

-- name: GetAppStateAtHeight :one
select block_height, app_hash
from core_app_state
where block_height = $1
limit 1;

-- name: GetAllRegisteredNodes :many
select *
from core_validators;

-- name: GetNodeByEndpoint :one
select *
from core_validators
where endpoint = $1
limit 1;

-- name: GetRegisteredNodesByType :many
select *
from core_validators
where node_type = $1;

-- name: GetLatestSlaRollup :one
select * from sla_rollups order by time desc limit 1;

-- name: GetRecentRollups :many
select * from sla_rollups order by time desc limit 10;

-- name: GetSlaRollupWithId :one
select * from sla_rollups where id = $1;

-- name: GetInProgressRollupReports :many
select * from sla_node_reports
where sla_rollup_id is null 
order by address;

-- name: GetRollupReportsForId :many
select * from sla_node_reports
where sla_rollup_id = $1
order by address;
