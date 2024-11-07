#!/bin/bash

# Check if callback URL is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <callback_url>"
    echo "Example: $0 https://example.com/webhook"
    exit 1
fi

source .env

# Capture the response
response=$(curl -s -X POST "https://www.strava.com/api/v3/push_subscriptions" \
  -d "client_id=$STRAVA_CLIENT_ID" \
  -d "client_secret=$STRAVA_CLIENT_SECRET" \
  -d "callback_url=$1" \
  -d "verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN")

echo $response | jq .