FROM denoland/deno:alpine

ENV VERSION v10.0.0
RUN apk add --no-cache coreutils supercronic

COPY dist/banq-mainnet.x86_64-linux.run /usr/local/bin/banq
RUN chmod +x /usr/local/bin/banq

COPY docker/mine.sh /usr/local/bin/mine.sh
RUN chmod +x /usr/local/bin/mine.sh

COPY docker/mine.cron /tmp/mine.cron
RUN crontab /tmp/mine.cron

CMD sh -c "/usr/local/bin/mine.sh & exec /usr/sbin/crond -f"
