# pgclone

![Logo](https://github.com/hobbsome/pgclone/raw/master/assets/pgclone.png =100x100)

Easily create backups of Postgres databases.

## 👋

pgclone is an open source NodeJS server that will periodically take backups of PostgreSQL servers. It's designed to be able to run on a Raspberry Pi or any other Linux-powered machine.

In addition to downloading backups, pgclone has a website! You can access it at `http://your-machines-ip:5101`. There, you can download individual backups, delete them, and do a ton of other cool things 😎.

## Installating

1. Clone this repo (`https://github.com/hobbsome/pgclone.git`).
2. `cd` into the cloned repo.
3. `chmod +x ./install.sh`
4. `./install.sh`


pgclone will automatically download 3 components: PostgreSQL client, NodeJS, and NPM. After that it will create a Unix user called `pgclone`. It then copies it's files into `/home/pgclone` and the service configuration file into it's proper place.


## Configuration

The next step would be to configure pgclone. pgclone creates a `config.json` in `/home/pgclone`. There are two root objects: `db` and `appearance`.

### `db`
This is where you provide configuration for pgclone to access your database.

#### `host`
Hostname of Postgres server. Can be an IP or fully-qualified domain name.
#### `port`
Port of Postgres server.
#### `username`
Username to access Postgres server.
#### `password`
Password to access Postgres server.
#### `database`
Database to backup (kind of important...)
#### `frequency`
A crontab description of how often to get backups. By default, it's once an hour, and if remove this field from the configuration, it will fall back to once an hour: `0 * * * *`.

### `appearance`
You can customize the look and feel of your pgclone server.

#### `name`
This is just a friendly name that will be used wherever pgclone would be used.
#### `color`
Hex color code. Used for accenting the UI.


### Sample
Here's the default configuration.
```
{
    "db": {
        "host":"localhost",
        "port":"5433",
        "username":"postgres",
        "password":"postgres",
        "database":"intrexb",
        "frequency": "0 * * * *"
    },
    "appearance": {
        "color":"#4e16ed",
        "title": "pgclone"
    }
}

```

## Updating

Updating is just as simple. `cd` into `/home/pgclone` and run `sudo ./update.sh`. By default, it will pull from `master`, but if you want to pull an update from another branch try `sudo ./update.sh YOUR_BRANCH`. Pretty cool, right??
