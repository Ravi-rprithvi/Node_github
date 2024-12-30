#!/bin/bash
cd /apps/pm2/sailsapi/apis
git pull
npm install
pm2 stop app.js
pm2 start app.js
echo `date` > /tmp/api_updated.txt
exit