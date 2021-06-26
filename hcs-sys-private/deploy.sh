GREEN='\033[0;32m'
NC='\033[0m'
RED='\033[0;31m'

echo
echo 
echo "${GREEN}START HCS-SYS-PRIVATE - DEPLOY.SH ...${NC}"
echo
echo "Deploy legacy system..."
vagrant up --provider=digital_ocean || { echo "${RED} FAILED: HCS-SYS-PRIVATE deployment ${NC}" ; exit 1; }
echo "Legacy system deployed"

echo
echo "${GREEN}FINISHED HCS-SYS-PRIVATE - DEPLOY.SH${NC}"
echo