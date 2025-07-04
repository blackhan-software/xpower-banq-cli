FROM denoland/deno:alpine
ENV VERSION=v1.0.0

RUN apk add --no-cache coreutils

COPY dist/banq-mainnet.x86_64-linux.run /usr/local/bin/banq
RUN chmod +x /usr/local/bin/banq

COPY docker/xpowerbanq/reindex/reindex.sh /usr/local/bin/reindex.sh
RUN chmod +x /usr/local/bin/reindex.sh

CMD ["sh", "-c", "/usr/local/bin/reindex.sh"]
