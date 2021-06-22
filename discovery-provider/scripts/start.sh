/wait

celery -A src.worker.celery worker --loglevel info &
celery -A src.worker.celery beat --loglevel info &
./scripts/dev-server.sh &

wait
