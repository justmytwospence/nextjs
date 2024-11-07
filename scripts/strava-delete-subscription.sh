#!/bin/bash

source .env

# Get the subscription ID
subscription_id=$("$(dirname "$0")/strava-view-subscription.sh" | jq -r '.[0].id')

# Check if subscription ID is retrieved
if [ -z "$subscription_id" ]; then
  echo "No subscription found."
  exit 1
fi

url="https://www.strava.com/api/v3/push_subscriptions/${subscription_id}\
?client_id=${STRAVA_CLIENT_ID}\
&client_secret=${STRAVA_CLIENT_SECRET}"
response=$(curl -X DELETE "$url")

echo $response | jq .
