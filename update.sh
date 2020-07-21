#!/bin/bash
echo " ---- pgclone updater. ---- "
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
    cp update.sh ./update.sh
    chmod +x /root/update.sh
    chmod +x update.sh
    chmod +x build/index.js
    chmod +x install.sh
    echo "#- Restarting service (5/5)"
    service intrex restart
    echo "#-- pgclone updated. --#"
    echo "#-- learn more at github.com/hobbsome/pgclone --#"
    echo "#-- thanks! --#"
fi