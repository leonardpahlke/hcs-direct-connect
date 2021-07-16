GREEN='\033[0;32m'
NC='\033[0m'

echo
echo 
echo "${GREEN}START HCS-SYS-PRIVATE - DESTROY.SH ...${NC}"
echo
echo "Destroy legacy system..."
vagrant destroy -f
echo "Legacy system destroyed"

echo
echo "${GREEN}FINISHED HCS-SYS-PRIVATE - DESTROY.SH${NC}"
echo