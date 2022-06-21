CREATE EXTENSION postgres_fdw;
CREATE SERVER fdw_server_connection FOREIGN DATA WRAPPER postgres_fdw OPTIONS (dbname :dbName, host :dbHost, port :dbPort);
CREATE USER MAPPING FOR postgres SERVER fdw_server_connection OPTIONS (user :dbUsername, password :dbPassword);
IMPORT FOREIGN SCHEMA "public"
limit to (users, tracks, blocks, ursm_content_nodes)
FROM SERVER fdw_server_connection INTO public;