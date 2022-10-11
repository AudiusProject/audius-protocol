# Run our own redis-server for tests to use
redis-server --daemonize yes

# Run our own database for tests to use
chown -R postgres:postgres /db
chmod 700 /db
sudo -u postgres pg_ctl init -D /db
echo "host all all 0.0.0.0/0 md5" >>/db/pg_hba.conf
echo "listen_addresses = '*'" >>/db/postgresql.conf
sudo -u postgres pg_ctl start -D /db -o "-c shared_preload_libraries=pg_stat_statements"
sudo -u postgres createdb audius_discovery
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${postgres_password:-postgres}';"

sleep inf