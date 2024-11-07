#!/bin/bash

source .env

# Capture the response
response=$(curl -G "https://www.strava.com/api/v3/push_subscriptions" \
  -d "client_id=$STRAVA_CLIENT_ID" \
  -d "client_secret=$STRAVA_CLIENT_SECRET")

echo $response | jq .