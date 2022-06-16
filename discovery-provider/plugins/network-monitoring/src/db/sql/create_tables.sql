CREATE TABLE network_monitoring_index_blocks (
    run_id SERIAL NOT NULL,
    is_current BOOL,
    blocknumber INT,
    is_complete BOOL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (run_id)
);
CREATE TABLE network_monitoring_content_nodes (
    spID INT NOT NULL,
    endpoint VARCHAR,
    run_id INT,
    CONSTRAINT fk_run_id FOREIGN KEY (run_id) REFERENCES network_monitoring_index_blocks(run_id),
    PRIMARY KEY (run_id, spID)
);
CREATE TABLE network_monitoring_users (
    user_id INT NOT NULL,
    wallet TEXT,
    replica_set VARCHAR,
    run_id INT,
    primary_clock_value INT,
    secondary1_clock_value INT,
    secondary2_clock_value INT,
    primarySpID INT,
    secondary1SpID INT,
    secondary2SpID INT,
    CONSTRAINT fk_run_id FOREIGN KEY (run_id) REFERENCES network_monitoring_index_blocks(run_id),
    CONSTRAINT fk_primarySpID FOREIGN KEY (run_id, primarySpID) REFERENCES network_monitoring_content_nodes(run_id, spID),
    CONSTRAINT fk_secondary1SpID FOREIGN KEY (run_id, secondary1SpID) REFERENCES network_monitoring_content_nodes(run_id, spID),
    CONSTRAINT fk_secondary2SpID FOREIGN KEY (run_id, secondary2SpID) REFERENCES network_monitoring_content_nodes(run_id, spID),
    PRIMARY KEY (run_id, user_id)
);
CREATE TABLE network_monitoring_cids_from_discovery (
    cid VARCHAR NOT NULL,
    run_id INT,
    user_id INT,
    ctype VARCHAR,
    CONSTRAINT fk_run_id FOREIGN KEY (run_id) REFERENCES network_monitoring_index_blocks(run_id),
    CONSTRAINT fk_user_id FOREIGN KEY (run_id, user_id) REFERENCES network_monitoring_users(run_id, user_id)
);
CREATE TABLE network_monitoring_cids_from_content (
    cid VARCHAR NOT NULL,
    run_id INT,
    user_id INT,
    content_node_spID INT,
    CONSTRAINT fk_run_id FOREIGN KEY (run_id) REFERENCES network_monitoring_index_blocks(run_id),
    CONSTRAINT fk_user_id FOREIGN KEY (run_id, user_id) REFERENCES network_monitoring_users(run_id, user_id),
    CONSTRAINT fk_content_node_spID FOREIGN KEY (run_id, content_node_spID) REFERENCES network_monitoring_content_nodes(run_id, spID)
);