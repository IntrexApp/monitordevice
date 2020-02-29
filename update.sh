#!/bin/bash
chown -R monitordevice:monitordevice ./
chmod -R 766 ./
su monitordevice
git reset --hard
git fetch origin master
git pull origin master
chmod +x ./install.sh
chmod +x ./update.sh
chmod +x ./index.js
chown -R monitordevice:monitordevice ./
chmod -R 766 ./
npm install
systemctl restart monitordevice.service