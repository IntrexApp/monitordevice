#!/bin/bash
echo "## welcome to pgclone."
echo "## we need to unpack a few boxes, this should only take a few minutes"
echo " --# Step 1/4 - Installing required software..."
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RELEASE=$(lsb_release -cs)
echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list
apt update
apt -y install postgresql-client-11 nodejs npm
npm install typescript -g

echo " --# Step 2/4 - Creating user..."
groupadd pgclone
useradd -g pgclone -m pgclone

echo " --# Step 3/4 - Copying files..."
mkdir /home/pgclone/backups
cp config/config.json /home/pgclone/config.json
cp ./update.sh /home/pgclone/update.sh
cp -R ./ /home/pgclone/bin
cp ./update.sh ~${SUDO_USER}/update.sh
chmod +x ~${SUDO_USER}/update.sh
chown -R pgclone:pgclone /home/pgclone/backups
chmod +x /home/pgclone/bin/index.js
cp config/config.service /etc/systemd/system/pgclone.service
chown -R pgclone:pgclone /home/pgclone
chmod -R +777 /home/pgclone

echo " --# Step 4/4 - Finalizing..."
cd /home/pgclone/bin 
npm install
tsc
systemctl daemon-reload
systemctl enable pgclone.service
systemctl restart pgclone.service