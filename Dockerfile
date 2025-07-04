FROM denoland/deno:alpine

ENV VERSION v10.0.0

RUN wget https://github.com/blackhan-software/xpower-banq-cli/releases/download/v1.0.0/banq-mainnet.x86_64-linux.run \
    -O /usr/local/bin/banq && chmod +x /usr/local/bin/banq

RUN apk add --no-cache socat dcron

COPY docker/start-miner.sh .
COPY docker/restart-miner.cron /etc/cron.d/restart-miner

RUN chmod 0644 /etc/cron.d/restart-miner && \
    crontab /etc/cron.d/restart-miner

CMD [ "/bin/sh", "./start-miner.sh" ]
