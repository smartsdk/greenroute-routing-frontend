#!/bin/bash

sed -i "s|GR_BACKEND_URL|${GR_BACKEND_URL}|g" /usr/share/nginx/html/main.bundle.js
sed -i "s|GR_ORION_URL|${GR_ORION_URL}|g" /usr/share/nginx/html/main.bundle.js

nginx -g "daemon off;"
