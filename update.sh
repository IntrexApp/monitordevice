#!/bin/bash
echo " ---- pgclone updater. ---- "

if [[ $(/usr/bin/id -u) -ne 0 ]]; then
    echo "!ERROR! - To update pgclone, you have to be running as root."
    exit
fi

if [ -z "$1" ]
then
    echo "    !- Branch = master (default) - (to change branches, type ./update.sh YOUR_BRANCH)"
else
    echo "    !- Branch = $1"
fi
read -p "!- Update with above specs (type y to continue)? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cd /home/pgclone/bin
    echo "#- Preparing update (1/5)"
    git reset --hard --quiet
    git fetch --all --quiet
    if [ -z "$1" ]
    then
        echo "  #- Pulling from master (override with ./update.sh YOUR_BRANCH)"
        git reset --hard origin/master --quiet
    else
        echo "  #- Pulling from $1"
        git reset --hard origin/$1 --quiet
    fi
    echo "#- Updating NPM (2/5)"
    npm install
    echo "#- Building TypeScript(3/5)"
    tsc
    echo "#- Overwriting installation (4/5)"
    cp update.sh /home/pgclone/update.sh
    chmod +x /home/pgclone/update.sh
    cp update.sh /home/${SUDO_USER}/update.sh
    chmod +x /home/${SUDO_USER}/update.sh
    chmod +x build/index.js
    chmod +x install.sh
    echo "    !- Update script copied to /home/${SUDO_USER}/update.sh. You can update from your home directory."
    echo "#- Restarting service (5/5)"
    service pgclone restart
    echo "#-- pgclone updated. --#"
    echo "#-- learn more at github.com/hobbsome/pgclone --#"
    echo "#-- thanks! --#"
fi