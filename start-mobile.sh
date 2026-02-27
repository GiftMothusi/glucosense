#!/usr/bin/env bash
set -e

echo "Starting GlucoSense Mobile..."

cd "$(dirname "$0")/mobile"
npx expo start --clear
