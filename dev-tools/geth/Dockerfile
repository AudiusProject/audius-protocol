FROM docker:latest AS dind

COPY . .

RUN chmod +x ./start.sh

# Set the default command to run after the container starts
CMD ["./start.sh"]
