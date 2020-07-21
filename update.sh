#!/bin/bash
git reset --hard
git fetch origin master
git pull origin master
chmod +x ./install.sh
chmod +x ./update.sh
chmod +x ./index.js
chown -R pgclone:pgclone /home/pgclone/bin
chmod -R +777 /home/pgclone
npm install
systemctl restart pgclone.service