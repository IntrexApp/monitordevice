#!/bin/bash

echo "Step 1/4 - Installing required software..."
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RELEASE=$(lsb_release -cs)
echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list
apt update
apt -y install postgresql-client-11 nodejs

echo "Step 2/4 - Creating user..."
groupadd monitordevice
useradd -g monitordevice -m monitordevice

echo "Step 3/4 - Copying files..."
mkdir /home/monitordevice/backups
cp config/config.json /home/monitordevice/config.json
cp -R ./ /home/monitordevice/bin
chown -R monitordevice:monitordevice /home/monitordevice/
chmod +x /home/monitordevice/bin/index.js
cp config/config.service /etc/systemd/system/monitordevice.service

echo "Step 4/4 - Finalizing..."
cd /home/monitordevice/bin 
npm install
systemctl enable monitordevice.service
systemctl restart monitordevice.service