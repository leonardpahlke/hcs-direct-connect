# This script is getting used to manually connect to one of the virtual machines that got createdr
LIGHT_BLUE='\033[1;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

nat_gw_user="ubuntu"
nat_gw_pk="~/.ssh/hcs-nat-key.pem"

folder_hcs_sys_public_cloud="hcs-sys-public"
folder_hcs_sys_private_cloud="hcs-sys-private"

echo "${LIGHT_BLUE}Enter to which VM you would like to connect to... (aws, gcp or doc)${NC}"
read mode

echo "${LIGHT_BLUE}($mode) input received... switch vm connections...${NC}"
# SWITCH VM CONNCECTIONS AFTER INPUT...

# Connect to NAT-GW in AmazonWebServices
if [ "$mode" = "aws" ]; then
    echo "${GREEN}Connect to AmazonWebServices $mode-vm${NC}"
    cd $folder_hcs_sys_public_cloud/
    hcs_sys_public_natInstancePublicIp=`pulumi stack output natInstancePublicIp`
    cd ..

    echo "${GREEN}Connect to NAT-GW VirtualMachine...${NC}"
    ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp || { echo "${RED}FAILED: Could not connect to VM 'ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp' ${NC}" ; exit 1; }

# Connect to NAT-GW in GoogleCloudPlatform
elif [ "$mode" = "gcp" ] 
then
    echo "${GREEN}Connect to GoogleCloudPlatform $mode-vm${NC}"
    echo "${YELLOW}..not implemented $mode-VM${NC}"

# Connect to Legacy-System in DigitalOcean
elif [ "$mode" = "doc" ] 
then
    cd $folder_hcs_sys_private_cloud/
    vagrant ssh || { echo "${RED}FAILED: Could not connect to VM 'vagrant ssh' ${NC}" ; exit 1; }
    cd ..
    echo "${GREEN}Connect to DigitalOcean $mode-vm${NC}"
else
    echo "${RED}CONNECT.SH Not enough arguments supplied, enter (aws, gcp or doc); ...exit${NC}"
    exit 1
fi