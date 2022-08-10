FROM node:14.17.5

RUN apt-get update && apt-get -y install -qq --force-yes cron

WORKDIR /network-monitoring 

# Install app dependencies from package.json. If modules are not included in the package.json file enter a RUN command. E.g. RUN npm install <module-name>
COPY package.json /network-monitoring/
RUN npm install

COPY . .

# Copy hello-cron file to the cron.d directory
COPY network-monitoring-cron /etc/cron.d/network-monitoring-cron

# Give exeuction rights to entrypoint script
RUN chmod 0744 /network-monitoring/new_job.sh
 
# Give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/network-monitoring-cron

# Apply cron job
RUN crontab /etc/cron.d/network-monitoring-cron
 
# Create the log file to be able to run tail
RUN touch /var/log/cron.log
 
# Run the command on container startup
CMD ["cron", "&&", "tail", "-f", "/var/log/cron.log"]
