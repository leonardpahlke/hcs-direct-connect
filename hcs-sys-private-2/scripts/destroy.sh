GREEN='\033[0;32m'
NC='\033[0m'

echo
echo 
echo "${GREEN}START HCS-SYS-PRIVATE - DESTROY.SH ...${NC}"
echo
echo "Destroy legacy system..."
terraform destroy -auto-approve || { echo "${RED} FAILED: HCS-SYS-PRIVATE deployment ${NC}" ; exit 1; }
echo "Legacy system destroyed"

echo
echo "${GREEN}FINISHED HCS-SYS-PRIVATE - DESTROY.SH${NC}"
echo
