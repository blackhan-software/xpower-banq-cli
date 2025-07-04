# XPowerBanq API Docker Image

A minimal and secure Go-based API providing read-only access to XPowerBanq
utilization rates and price quotes.

## Quick Start

Build and run the API:

```sh
# Build the Docker image
./docker/xpowerbanq/banq-api/build.sh

# Run the container with resource limits
docker run -d --name banq-api \
  --cpus=0.5 --memory=500m --memory-swap=500m \
  -v /var/lib/banq:/var/lib/banq:ro \
  -v /srv/db:/srv/db:ro \
  -p 8001:8001 \
  xpowerbanq/banq-api

# Test the API
curl http://localhost:8001/health

# Monitor resource usage
docker stats banq-api
```

## Overview

This lightweight Go service provides:

### Resource Efficiency

- **Minimal memory footprint**: ~5-10MB at idle
- **Compact image size**: ~20MB
- **Negligible CPU usage**: <1% at idle

### Security

- Hardcoded SQL queries prevent injection attacks
- Read-only database access
- Input validation on all parameters
- Runs as non-root user (UID 1000)
- Minimal attack surface

### Simplicity

- Single statically-linked binary
- Minimal dependencies (Chi router, CORS middleware, SQLite driver)
- Chi router with radix tree for fast HTTP routing
- Command-line configuration (no config files needed)
- Fast startup time
- Configurable result limits (default: 90 rows)
- CORS support via Chi middleware

## Building the Image

```sh
./docker/xpowerbanq/banq-api/build.sh
```

Or directly:

```sh
docker build -t xpowerbanq/banq-api -f docker/xpowerbanq/banq-api/Dockerfile .
```

## Running the Container

### Basic Usage

```sh
docker run -d --name banq-api \
  -v /var/lib/banq:/var/lib/banq:ro \
  -v /srv/db:/srv/db:ro \
  -p 8001:8001 \
  xpowerbanq/banq-api
```

### With Resource Limits (Recommended)

```sh
docker run -d --name banq-api \
  --cpus=0.5 --memory=500m --memory-swap=500m \
  -v /var/lib/banq:/var/lib/banq:ro \
  -v /srv/db:/srv/db:ro \
  -p 8001:8001 \
  xpowerbanq/banq-api
```

**Resource Limits:**

- `--cpus=0.5` - Limits to 50% of one CPU core (adjust based on your system)
- `--memory=500m` - Limits to 500MB RAM (sufficient for this lightweight
  service)
- `--memory-swap=500m` - Prevents swap usage

**Calculating CPU Limits:** To limit to 50% of total system CPU:

- 1 CPUs: `--cpus=0.5`
- 2 CPUs: `--cpus=1.0`
- 4 CPUs: `--cpus=2.0`
- 8 CPUs: `--cpus=4.0`

Check your CPU count: `nproc` or `lscpu`

### With Custom Configuration

The API supports command-line arguments for configuration. To pass arguments in
Docker, append them after the image name:

```sh
# Custom port
docker run -d --name banq-api \
  -p 9000:9000 \
  xpowerbanq/banq-api \
  -p 9000

# Custom database path
docker run -d --name banq-api \
  -v /custom/db:/custom/db:ro \
  -p 8001:8001 \
  xpowerbanq/banq-api \
  -P /custom/db

# Custom max rows
docker run -d --name banq-api \
  -p 8001:8001 \
  xpowerbanq/banq-api \
  -R 50

# Custom CORS origins
docker run -d --name banq-api \
  -p 8001:8001 \
  xpowerbanq/banq-api \
  -O '["https://example.com","http://localhost:3000"]'

# Combined options
docker run -d --name banq-api \
  -v /data/db:/data/db:ro \
  -p 9000:9000 \
  xpowerbanq/banq-api \
  -p 9000 -P /data/db -R 100

# Show help
docker run --rm xpowerbanq/banq-api -h
docker run --rm xpowerbanq/banq-api --help
```

See [README.md](./README.md#configuration) for complete documentation of all
available command-line arguments and their defaults.

### Database Files

The service expects SQLite database files in `/srv/db` (or the path specified
via `-P`):

- `ri_*.db` - Rate Index databases (for daily_average queries)
- `rt_*.db` - Rate Tracker databases (for daily_ohlc queries)

## API Endpoints

### GET /

Returns API information and available endpoints.

### GET /health

Health check endpoint. Returns `{"status": "ok"}`.

### GET /robots.txt

Returns robots.txt blocking all crawlers.

### GET /{dbName}/daily_average

Returns daily average utilization rates from the specified Rate Index database.

**Path Parameters:**

- `dbName` - Database name (without `.db` extension, e.g., `ri_apow_supply_0`)

**Query Parameters:**

- `lhs` - Start date (ISO format: YYYY-MM-DD)
- `rhs` - End date (ISO format: YYYY-MM-DD)

**Example:**

```sh
curl "http://localhost:8001/ri_apow_supply_0/daily_average?lhs=2025-11-15&rhs=2025-12-15"
```

**Response:**

```json
[
  {
    "avg_util": 0,
    "day": "2025-11-18",
    "n": 1
  },
  {
    // ...
  }
]
```

### GET /{dbName}/daily_ohlc

Returns daily OHLC (Open-High-Low-Close) price quotes from the specified Rate
Tracker database.

**Path Parameters:**

- `dbName` - Database name (without `.db` extension, e.g., `rt_apow_xpow_0`)

**Query Parameters:**

- `lhs` - Start date (ISO format: YYYY-MM-DD)
- `rhs` - End date (ISO format: YYYY-MM-DD)

**Example:**

```sh
curl "http://localhost:8001/rt_apow_xpow_0/daily_ohlc?lhs=2025-11-15&rhs=2025-12-15"
```

**Response:**

```json
[
  {
    "open": 116119.6326425605,
    "high": 116119.6326425605,
    "low": 116119.6326425605,
    "close": 116119.6326425605,
    "day": "2025-11-21",
    "n": 2
  },
  {
    // ...
  }
]
```

## CORS Configuration

By default, the service supports CORS for these origins:

- `https://www.xpowermine.com`
- `https://www.xpowerbanq.com`
- `http://localhost:5173`

Custom origins can be configured via the `-O` / `--cors-origins` flag (see
[Configuration](#with-custom-configuration)).

CORS headers:

- `Access-Control-Allow-Origin`: Reflects allowed origin
- `Access-Control-Allow-Credentials`: false
- `Access-Control-Expose-Headers`: Content-Type, X-Database
- `Access-Control-Max-Age`: 3600

## Security Features

1. **Hardcoded SQL Queries**: Prevents SQL injection by using parameterized
   queries only
2. **Read-Only Database Access**: Opens SQLite databases in read-only and
   immutable mode
3. **Input Validation**: Validates date format (YYYY-MM-DD) using regex and
   enforces database name prefixes
4. **Row Limit**: Configurable row limit (default: 90) prevents resource
   exhaustion
5. **Non-Root User**: Container runs as user `banq` (UID 1000)
6. **Minimal Dependencies**: Chi router, CORS middleware, SQLite driver - all
   well-maintained libraries
7. **Static Binary**: Single statically-linked binary with no runtime
   dependencies
8. **CORS Security**: Chi CORS middleware with strict origin validation and
   credentials disabled

## Database Schema Requirements

The service expects databases with these views:

**Rate Index (ri_*.db):**

- `riw_view` table/view with columns:
  - `util_e18` (numeric)
  - `stamp_iso` (text, ISO timestamp)

**Rate Tracker (rt_*.db):**

- `rtw_view` table/view with columns:
  - `quote_bid_e18` (numeric)
  - `quote_ask_e18` (numeric)
  - `quote_time_iso` (text, ISO timestamp)

## Monitoring

The service includes a health check endpoint at `/health` that can be used for
container orchestration:

```sh
curl http://localhost:8001/health
```

Docker health check runs every 30 seconds with a 3-second timeout.

## License

Apache-2.0 - See project repository for details.
