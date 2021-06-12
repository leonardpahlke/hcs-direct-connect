GREEN='\033[0;32m'
NC='\033[0m'

echo
echo
echo "${GREEN}START HCS-SYS-PLATFORM - DESTROY.SH${NC}"
echo

pulumi destroy -f

echo
echo "${GREEN}FINISHED HCS-SYS-PLATFORM - DESTROY.SH${NC}"
echo