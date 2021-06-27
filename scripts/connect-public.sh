# This script is getting used to manually connect to one of the virtual machines that got createdr
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

nat_gw_user="ubuntu"
nat_gw_pk="~/.ssh/hcs-nat-key.pem"
folder_hcs_sys_public_cloud="hcs-sys-public"


cd $folder_hcs_sys_public_cloud/
hcs_sys_public_natInstancePublicIp=`pulumi stack output natInstancePublicIp`
cd ..

echo "${GREEN}Connect to NAT-GW VirtualMachine...${NC}"
ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp || { echo "${RED} FAILED: Could not connect to VM 'ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp' ${NC}" ; exit 1; }