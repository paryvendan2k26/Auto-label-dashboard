#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:5000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  API Testing Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s $API_URL/health | jq '.'
echo -e "\n"

# Test 2: Upload Dataset
echo -e "${YELLOW}Test 2: Upload Dataset${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST $API_URL/api/datasets/upload -F "file=@sample-data.csv")
echo $UPLOAD_RESPONSE | jq '.'
DATASET_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data.datasetId')
echo -e "${GREEN}Dataset ID: $DATASET_ID${NC}\n"

# Test 3: Get All Datasets
echo -e "${YELLOW}Test 3: Get All Datasets${NC}"
curl -s $API_URL/api/datasets | jq '.'
echo -e "\n"

# Test 4: Configure Schema
echo -e "${YELLOW}Test 4: Configure Schema${NC}"
curl -s -X POST $API_URL/api/datasets/$DATASET_ID/configure \
  -H "Content-Type: application/json" \
  -d '{
    "labelingSchema": "Classify sentiment as: positive (satisfied), negative (disappointed), or neutral (neither)",
    "labelType": "sentiment"
  }' | jq '.'
echo -e "\n"

# Test 5: Start Labeling
echo -e "${YELLOW}Test 5: Start Labeling${NC}"
curl -s -X POST $API_URL/api/labels/dataset/$DATASET_ID/label | jq '.'
echo -e "\n"

# Wait for labeling to complete
echo -e "${BLUE}Waiting 5 seconds for labeling to complete...${NC}"
sleep 5

# Test 6: Check Progress
echo -e "${YELLOW}Test 6: Check Progress${NC}"
curl -s $API_URL/api/stats/dataset/$DATASET_ID/progress | jq '.'
echo -e "\n"

# Test 7: Get Queue Summary
echo -e "${YELLOW}Test 7: Get Queue Summary${NC}"
curl -s $API_URL/api/stats/dataset/$DATASET_ID/queue-summary | jq '.'
echo -e "\n"

# Test 8: Get Statistics
echo -e "${YELLOW}Test 8: Get Statistics${NC}"
curl -s $API_URL/api/stats/dataset/$DATASET_ID/statistics | jq '.'
echo -e "\n"

# Test 9: Get Review Queue
echo -e "${YELLOW}Test 9: Get Review Queue (first page)${NC}"
QUEUE_RESPONSE=$(curl -s "$API_URL/api/labels/dataset/$DATASET_ID/review-queue?page=1&limit=5&sort=confidence")
echo $QUEUE_RESPONSE | jq '.'
ITEM_ID=$(echo $QUEUE_RESPONSE | jq -r '.data.items[0]._id')
echo -e "${GREEN}First Item ID: $ITEM_ID${NC}\n"

# Test 10: Accept a Label
if [ "$ITEM_ID" != "null" ]; then
  echo -e "${YELLOW}Test 10: Accept a Label${NC}"
  curl -s -X PUT $API_URL/api/labels/$ITEM_ID \
    -H "Content-Type: application/json" \
    -d '{
      "action": "accept",
      "reviewedBy": "test-script"
    }' | jq '.'
  echo -e "\n"
fi

# Test 11: Export Dataset
echo -e "${YELLOW}Test 11: Export Dataset${NC}"
curl -s $API_URL/api/stats/dataset/$DATASET_ID/export > exported-data.csv
echo -e "${GREEN}✅ Dataset exported to exported-data.csv${NC}"
head -5 exported-data.csv
echo -e "\n"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All Tests Completed!${NC}"
echo -e "${GREEN}========================================${NC}\n"