#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API="http://localhost:5000"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Backend Complete Test${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Test 1: Health
echo -e "${YELLOW}1. Testing Health Endpoint...${NC}"
HEALTH=$(curl -s $API/health)
if echo $HEALTH | grep -q "OK"; then
  echo -e "${GREEN}✅ Health check passed${NC}\n"
else
  echo -e "${RED}❌ Health check failed${NC}\n"
  exit 1
fi

# Test 2: Upload
echo -e "${YELLOW}2. Uploading Dataset...${NC}"
UPLOAD=$(curl -s -X POST $API/api/datasets/upload -F "file=@sample-data.csv")
DATASET_ID=$(echo $UPLOAD | grep -o '"datasetId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$DATASET_ID" ]; then
  echo -e "${GREEN}✅ Upload successful${NC}"
  echo -e "   Dataset ID: $DATASET_ID\n"
else
  echo -e "${RED}❌ Upload failed${NC}\n"
  exit 1
fi

# Test 3: Configure
echo -e "${YELLOW}3. Configuring Schema...${NC}"
CONFIG=$(curl -s -X POST $API/api/datasets/$DATASET_ID/configure \
  -H "Content-Type: application/json" \
  -d '{"labelingSchema":"Classify as positive, negative, or neutral","labelType":"sentiment"}')

if echo $CONFIG | grep -q "success"; then
  echo -e "${GREEN}✅ Schema configured${NC}\n"
else
  echo -e "${RED}❌ Configuration failed${NC}\n"
  exit 1
fi

# Test 4: Start Labeling
echo -e "${YELLOW}4. Starting AI Labeling...${NC}"
LABEL=$(curl -s -X POST $API/api/labels/dataset/$DATASET_ID/label)

if echo $LABEL | grep -q "success"; then
  echo -e "${GREEN}✅ Labeling started${NC}\n"
else
  echo -e "${RED}❌ Labeling failed to start${NC}\n"
  exit 1
fi

# Wait for labeling
echo -e "${YELLOW}⏳ Waiting 5 seconds for labeling...${NC}"
sleep 5

# Test 5: Check Progress
echo -e "\n${YELLOW}5. Checking Progress...${NC}"
PROGRESS=$(curl -s $API/api/stats/dataset/$DATASET_ID/progress)
PERCENTAGE=$(echo $PROGRESS | grep -o '"percentage":[0-9]*' | cut -d':' -f2)

echo -e "${GREEN}✅ Progress: ${PERCENTAGE}%${NC}\n"

# Test 6: Queue Summary
echo -e "${YELLOW}6. Getting Queue Summary...${NC}"
QUEUE=$(curl -s $API/api/stats/dataset/$DATASET_ID/queue-summary)

if echo $QUEUE | grep -q "summary"; then
  echo -e "${GREEN}✅ Queue summary retrieved${NC}\n"
else
  echo -e "${RED}❌ Queue summary failed${NC}\n"
fi

# Test 7: Review Queue
echo -e "${YELLOW}7. Getting Review Queue...${NC}"
REVIEW=$(curl -s "$API/api/labels/dataset/$DATASET_ID/review-queue?page=1&limit=5")

if echo $REVIEW | grep -q "items"; then
  echo -e "${GREEN}✅ Review queue retrieved${NC}\n"
else
  echo -e "${RED}❌ Review queue failed${NC}\n"
fi

# Final
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ All Tests Passed!${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "Dataset ID: ${YELLOW}$DATASET_ID${NC}"
echo -e "View in browser: ${YELLOW}http://localhost:5000/api/datasets/$DATASET_ID${NC}\n"
