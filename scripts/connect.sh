# This script is getting used to manually connect to one of the virtual machines that got createdr
# - - - - - - - - - - - - - - - - -
# VARIABLES
# - - - - - - - - - - - - - - - - -
LIGHT_BLUE='\033[1;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

nat_gw_user="ubuntu"
nat_gw_pk="~/.ssh/hcs-nat-key.pem"

project_subfolder=""
folder_hcs_sys_public_cloud=""
folder_hcs_sys_private_cloud=""

# Reference codes
modeGcp="gcp"
modeAws="aws"
modeDo="do"

prjHcs1="hcs1"
prjHcs2="hcs2"

prjHcs1Modes="[${YELLOW}${modeAws}${NC}, ${YELLOW}${modeDo}${NC}]"
prjHcs2Modes="[${YELLOW}${modeGcp}${NC}, ${YELLOW}${modeDo}${NC}]"
prj=""
mode=""

if [ $# -eq 2 ]; then
    prj=$1
    mode=$2
else
    echo "${YELLOW}HCS-SYS-PUBLIC connection info needed${NC}"
    echo "${LIGHT_BLUE}Enter to which project resources you would like to connect to... [${prjHcs1}, ${prjHcs2}]${NC}"
    read prj
    echo "${LIGHT_BLUE}Enter to which cloud you like to connect to... hcs1:${prjHcs1Modes}, hcs2:${prjHcs2Modes}${NC}"
    read mode
fi

# - - - - - - - - - - - - - - - - -
# CONNECT LOGIC
# 1. Get input project reference (HCS-1, HCS-2)
# 2. Get input project resource (AWS VM, GCP, VM, ...)
# 3. Connect to resource
# - - - - - - - - - - - - - - - - -

#
# 1. Get input project reference (HCS-1, HCS-2)
#

# Check input
if [ $prj = $prjHcs1 ]; then
    project_subfolder="hcs_1"
    folder_hcs_sys_public_cloud="${project_subfolder}/hcs-sys-public"
    folder_hcs_sys_private_cloud="${project_subfolder}/hcs-sys-private"
    echo "${LIGHT_BLUE}Enter to which VM you would like to connect to... ${prjHcs1Modes}${NC}"
elif [ $prj = $prjHcs2 ]; then
    project_subfolder="hcs_2"
    folder_hcs_sys_public_cloud="${project_subfolder}/hcs-sys-public-2"
    folder_hcs_sys_private_cloud="${project_subfolder}/hcs-sys-private-2"
    echo "${LIGHT_BLUE}Enter to which VM you would like to connect to... ${prjHcs2Modes}${NC}"
else
    echo "${RED}INPUT [${prj}] INVALID, enter [${prjHcs1}, ${prjHcs2}], exit...${NC}"
    exit 1
fi

#
# 2. Get input project resource (AWS VM, GCP, VM, ...)
#

# Check input
if [ $prj = $prjHcs1 ]; then
    if [ $mode = $modeAws ] || [ $mode = $modeDo ]; then
        echo "${LIGHT_BLUE}mode input valid${NC}"
    else
        echo "${RED}INPUT [${mode}] INVALID, enter ${prjHcs1Modes}, exit...${NC}"
        exit 1
    fi
elif [ $prj = $prjHcs2 ]; then
    if [ $mode = $modeGcp ] || [ $mode = $modeDo ]; then
        echo "${LIGHT_BLUE}Mode input valid${NC}"
    else
        echo "${RED}INPUT [${mode}] INVALID, enter ${prjHcs2Modes}, exit...${NC}"
        exit 1
    fi
fi

#
# 3. Connect to resource
#
echo "${LIGHT_BLUE}Input received... switch vm connections...${NC}"
# SWITCH VM CONNCECTIONS AFTER INPUT...

echo "${GREEN}Connect to resource:${mode} in project:${prj}${NC}"
if [ $prj = $prjHcs1 ]; then
    if [ $mode = $modeAws ]; then
        cd $folder_hcs_sys_public_cloud/
        hcs_sys_public_natInstancePublicIp=$(pulumi stack output natInstancePublicIp)
        echo "Connect with info: ${hcs_sys_public_natInstancePublicIp}"
        ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp || {
            echo "${RED}FAILED: Could not connect to VM 'ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp' ${NC}"
            exit 1
        }

    # Connect to Legacy-System in DigitalOcean
    elif [ $mode = $modeDo ]; then
        cd $folder_hcs_sys_private_cloud/
        vagrant ssh || {
            echo "${RED}FAILED: Could not connect to VM 'vagrant ssh' ${NC}"
            exit 1
        }
    fi
elif [ $prj = $prjHcs2 ]; then
    if [ $mode = $modeGcp ]; then
        cd $folder_hcs_sys_public_cloud/
        zone=$(pulumi stack output instance_zone) || {
            echo "${RED}FAILED CONNECT: pulumi stack output instance_zone${NC}"
            exit 1
        }
        instance_name=$(pulumi stack output instance_name) || {
            echo "${RED}FAILED CONNECT: pulumi stack output instance_name${NC}"
            exit 1
        }
        project_name=$(pulumi stack output project_name) || {
            echo "${RED}FAILED CONNECT: pulumi stack output project_name${NC}"
            exit 1
        }

        echo "Connect with info: ${zone}, ${instance_name}, ${project_name}"

        gcloud beta compute ssh --zone $zone $instance_name --tunnel-through-iap --project $project_name || {
            echo "${RED}FAILED CONNECT: gcloud beta compute ssh${NC}"
            exit 1
        }

    # Connect to Legacy-System in DigitalOcean
    elif [ $mode = $modeDo ]; then
        cd $folder_hcs_sys_private_cloud/
        vmPublicIpv4=$(terraform output -raw floating_ipv4) || {
            echo "${RED}FAILED CONNECT: terraform output -raw floating_ipv4${NC}"
            exit 1
        }
        echo "Connect to legacy-vm with info vmPublicIpv4: ${vmPublicIpv4}"
        ssh -o StrictHostKeyChecking=no -i $onprem_vm_pvt_key root@$vmPublicIpv4 || {
            echo "${RED}FAILED CONNECT: ssh root@${vmPublicIpv4} ssh${NC}"
            exit 1
        }
    fi
fi
