# XPowerbanq/datasette

# Build

```sh
./docker/xpowerbanq/datasette/build.sh # image
```

# Run

Ensure the `/var/lib/banq` volume mount-point (incl. `*.db` files) exists:

```sh
ls -lh /var/lib/banq
```

Ensure the `/srv/db` volume mount-point (incl. `*.db` files) exists:

```sh
ls -lh /srv/db
```

Then, run the docker instance to start serving API requests:

```sh
docker run --rm -ti -p 8001:8001 \
  -v /var/lib/banq:/var/lib/banq:ro \
  -v /srv/db:/srv/db:ro \
  xpowerbanq/datasette
```

## FAQ

### What should the `/var/lib/banq` volume contain?

It should contain at least one (or more) `sqlite` database files with a `*.db`
suffix. Further, it may also contain `*.db-wal` (write-ahead log) and `*.db-shm`
(shared memory) files.

### What should the `/srv/db` volume contain?

It should contain at least one (or more) `sqlite` database files with a `*.db`
suffix. The `*.db` files may be (sanitized) symbolic links pointing to those in
the `/var/lib/banq` directory.
