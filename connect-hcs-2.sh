LIGHT_BLUE='\033[1;34m'
NC='\033[0m'
RED='\033[0;31m'

echo
echo "${LIGHT_BLUE}CONNECT TO HCS-2 RESOURCE...${NC}"
echo

if [ $1 == "prv" ] 
then
    echo "connect to private cloud vm - legacy-vm"
    onprem_vm_pvt_key="~/.ssh/id_rsa_hcs"
    cd "./hcs_2/hcs-sys-private-2"
    vmPublicIpv4=`terraform output -raw floating_ipv4` || { echo "${RED}FAILED CONNECT: terraform output -raw floating_ipv4${NC}" ; exit 1; }

    echo "${LIGHT_BLUE}Connect to legacy-vm with info vmPublicIpv4: ${vmPublicIpv4}${NC}"
    ssh -o StrictHostKeyChecking=no -i $onprem_vm_pvt_key root@$vmPublicIpv4 || { echo "${RED}FAILED CONNECT: ssh root@${vmPublicIpv4} ssh${NC}" ; exit 1; }
    
elif [ $1 == "pub" ] 
then
    echo "connect to public cloud vm - request-handler"
    
    cd "./hcs_2/hcs-sys-public-2"
    zone=`pulumi stack output instance_zone` || { echo "${RED}FAILED CONNECT: pulumi stack output instance_zone${NC}" ; exit 1; }
    instance_name=`pulumi stack output instance_name` || { echo "${RED}FAILED CONNECT: pulumi stack output instance_name${NC}" ; exit 1; }
    project_name=`pulumi stack output project_name` || { echo "${RED}FAILED CONNECT: pulumi stack output project_name${NC}" ; exit 1; }

    echo "With info: ${zone}, ${instance_name}, ${project_name}"

    gcloud beta compute ssh --zone $zone $instance_name --tunnel-through-iap --project $project_name || { echo "${RED}FAILED CONNECT: gcloud beta compute ssh${NC}" ; exit 1; }
else
    echo "${RED}CANNOT CONNECT - invoke script with argument [prv, pub]${NC}"
fi
