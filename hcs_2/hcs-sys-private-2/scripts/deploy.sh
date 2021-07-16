GREEN='\033[0;32m'
NC='\033[0m'
RED='\033[0;31m'

echo
echo 
echo "${GREEN}START HCS-SYS-PRIVATE-2 - DEPLOY.SH ...${NC}"
echo

terraform apply -auto-approve || { echo "${RED} FAILED: HCS-SYS-PRIVATE-2 deployment ${NC}" ; exit 1; }

echo
echo "${GREEN}FINISHED HCS-SYS-PRIVATE-2 - DEPLOY.SH${NC}"
echo
