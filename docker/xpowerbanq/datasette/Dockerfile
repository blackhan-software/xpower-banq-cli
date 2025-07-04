FROM python:3.11-slim

RUN pip install --no-cache-dir datasette
ENV PYTHONUNBUFFERED=1
EXPOSE 8080

CMD ["sh", "-c", "datasette serve /srv/db/*.db --host 0.0.0.0 --port 8001 --cors --setting base_url /db/"]
