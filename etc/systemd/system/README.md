# Banq Systemd Services

This directory contains systemd service files for managing Banq operations on
Linux systems.

## Service Overview

Common characteristics across all services (unless noted otherwise):

- Run as root (no user isolation)
- Standard resource limits: 50% CPU quota, 500MB memory maximum
- Template services (using `@`) load environment from
  `/etc/banq/banq.env.mainnet`
- Batch processing services (suffix `w@`) scan blockchain over last 86400
  blocks, ingest event logs to database, and auto-restart on failure with 10
  second delay
- One-shot wrapper services execute shell scripts for one-time execution
- All services log to systemd journal

### API Service

**`banq-api.service`**

- Docker-based REST API service
- Runs the `xpowerbanq/banq-api` Docker container
- Resource limits: 0.5 CPU, 500MB memory
- Exposes port 8001 on localhost only
- Mounts `/var/lib/banq` and `/srv/db` as read-only volumes
- Auto-restarts on failure (max 3 times)

### Reindex Services

**`banq-ri.service`** (one-shot wrapper)

- Executes `/usr/local/bin/banq-ri.sh`

**`banq-ri@.service`** (templated instance)

- Runs `banq reindex` command with parameterized arguments
- Instance format: `banq-ri@TOKEN_MODE_POOL.service`
- Example: `banq-ri@APOW_increment_P000.service`
- Parses instance name as: `TOKEN_MODE_POOL` (separated by `_` or `:`)
- Includes 2-second startup delay to avoid nonce conflicts when multiple
  instances start in parallel

**`banq-riw.service`** (one-shot wrapper)

- Executes `/usr/local/bin/banq-riw.sh`

**`banq-riw@.service`** (templated batch processing instance)

- Scans blockchain over last 86400 blocks and runs `banq reindex` with
  parameterized arguments
- Pipes output to `/usr/local/bin/banq-riw2db.sh` for database storage
- Instance format: `banq-riw@TOKEN_MODE_POOL.service`
- Database file: `/var/lib/banq/ri-%I.db`

### TWAP (Time-Weighted Average Price) Services

**`banq-rt.service`** (one-shot wrapper)

- Executes `/usr/local/bin/banq-rt.sh`

**`banq-rt@.service`** (templated instance)

- Runs `banq retwap` command with parameterized arguments
- Instance format: `banq-rt@TOKEN0_TOKEN1_ORACLE.service`
- Example: `banq-rt@APOW_AVAX_T000.service`
- Parses instance name as: `TOKEN0_TOKEN1_ORACLE` (separated by `_` or `:`)
- Includes 2-second startup delay to avoid nonce conflicts when multiple
  instances start in parallel

**`banq-rtw.service`** (one-shot wrapper)

- Executes `/usr/local/bin/banq-rtw.sh`

**`banq-rtw@.service`** (templated batch processing instance)

- Scans blockchain over last 86400 blocks and runs `banq retwap` with
  parameterized arguments
- Pipes output to `/usr/local/bin/banq-rtw2db.sh` for database storage
- Instance format: `banq-rtw@TOKEN0_TOKEN1_ORACLE.service`
- Database file: `/var/lib/banq/rt-%I.db`

## Timers

Systemd timers are included to schedule periodic execution of the wrapper
services:

**`banq-ri.timer`**

- Triggers `banq-ri.service` twice daily at 6:30 and 18:30
- Includes random delay of 0-60 seconds
- Persistent (catches up on missed runs)

**`banq-riw.timer`**

- Triggers `banq-riw.service` twice daily at 6:45 and 18:45
- Includes random delay of 0-60 seconds
- Persistent (catches up on missed runs)

**`banq-rt.timer`**

- Triggers `banq-rt.service` hourly at the top of each hour
- Includes random delay of 0-60 seconds
- Persistent (catches up on missed runs)

**`banq-rtw.timer`**

- Triggers `banq-rtw.service` twice daily at 6:15 and 18:15
- Includes random delay of 0-60 seconds
- Persistent (catches up on missed runs)

## Usage Examples

### Managing Timers

```bash
# Enable and start timers
sudo systemctl enable --now banq-ri.timer
sudo systemctl enable --now banq-riw.timer
sudo systemctl enable --now banq-rt.timer
sudo systemctl enable --now banq-rtw.timer

# Check timer status and next scheduled run
sudo systemctl status banq-ri.timer
sudo systemctl list-timers 'banq-*'

# View timer logs
sudo journalctl -u banq-ri.timer -f
```

### API Service

```bash
# Start the API service
sudo systemctl start banq-api.service

# Enable on boot
sudo systemctl enable banq-api.service

# Check logs
sudo journalctl -u banq-api.service -f
```

## Security

### Privilege Model

All services run as root without user isolation:

- **Template Services** (`banq-ri@.service`, `banq-rt@.service`,
  `banq-riw@.service`, `banq-rtw@.service`, `banq-api.service`)
  - Run as root with full system privileges
  - Execute blockchain operations and CLI commands
  - Have resource limits (CPU/memory) but no privilege separation

- **Wrapper Services** (`banq-ri.service`, `banq-rt.service`,
  `banq-riw.service`, `banq-rtw.service`)
  - Run as root
  - Execute `systemctl restart` commands to orchestrate template services

### Known Security Limitations

1. **No User Isolation**
   - All services run as root without privilege separation
   - No defense-in-depth if a service is compromised

2. **No Advanced Security Hardening**
   - Missing systemd security directives like `PrivateTmp=`, `NoNewPrivileges=`,
     `ProtectSystem=`, etc.
   - **Recommendation**: Add security hardening options to all service files
     based on your security requirements

## Installation and Setup

### 1. Install Banq CLI and Scripts

First, install the Banq CLI binary and wrapper scripts to `/usr/local/bin/`:

```bash
# Install banq CLI binary (adjust source path as needed)
sudo cp /tmp/banq-mainnet.x86_64-linux.run /usr/local/bin/banq

# Install wrapper scripts (adjust source path as needed)
sudo cp usr/local/bin/banq-*.sh /usr/local/bin/
```

### 2. Set Script Permissions

After installation, make scripts executable:

```bash
sudo chmod 755 /usr/local/bin/banq
sudo chmod 755 /usr/local/bin/banq-*.sh
```

### 3. Create Required Directories

```bash
# Configuration directory
sudo mkdir -p /etc/banq

# State directory for database files
sudo mkdir -p /var/lib/banq

# Database directory (if needed by API service)
sudo mkdir -p /srv/db
```

### 4. Install Environment Configuration

```bash
# Copy environment file (adjust source path as needed)
sudo cp etc/banq/banq.env.mainnet /etc/banq/banq.env.mainnet
sudo chmod 644 /etc/banq/banq.env.mainnet
```

### 5. Install Systemd Service Files

```bash
# Copy service and timer files
sudo cp etc/systemd/system/*.service /etc/systemd/system/
sudo cp etc/systemd/system/*.timer /etc/systemd/system/

# Reload systemd to recognize new services
sudo systemctl daemon-reload
```

### 6. Enable and Start Services

```bash
# Start the API service
sudo systemctl enable --now banq-api.service

# Enable timers for scheduled execution
sudo systemctl enable --now banq-ri.timer
sudo systemctl enable --now banq-riw.timer
sudo systemctl enable --now banq-rt.timer
sudo systemctl enable --now banq-rtw.timer
```

## Dependencies

- `/usr/local/bin/banq` - Banq CLI binary
- `/usr/local/bin/banq-ri.sh` - Reindex wrapper script
- `/usr/local/bin/banq-riw.sh` - Reindex watch wrapper script
- `/usr/local/bin/banq-riw2db.sh` - Reindex to database script
- `/usr/local/bin/banq-rt.sh` - TWAP wrapper script
- `/usr/local/bin/banq-rtw.sh` - TWAP watch wrapper script
- `/usr/local/bin/banq-rtw2db.sh` - TWAP to database script
- `/etc/banq/banq.env.mainnet` - Environment configuration file
- `/var/lib/banq/` - State directory for database files
- Docker (for banq-api.service)

## Template Service Parameter Format

### Reindex Services (`@TOKEN_MODE_POOL`)

- `TOKEN`: Token symbol (e.g., APOW, XPOW)
- `MODE`: Reindex mode (e.g., increment, full)
- `POOL`: Pool identifier (e.g., P000, P001)
- Separator: `_` or `:`

### TWAP Services (`@TOKEN0_TOKEN1_ORACLE`)

- `TOKEN0`: First token symbol (e.g., APOW, XPOW)
- `TOKEN1`: Second token symbol (e.g., AVAX, USDC)
- `ORACLE`: Oracle identifier (e.g., T000, T001)
- Separator: `_` or `:`
