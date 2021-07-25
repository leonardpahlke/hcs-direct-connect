LIGHT_BLUE='\033[1;34m'
NC='\033[0m'

# This file will destroy the HCS-1 system to the configured system.
# The folowing three systems are getting destroyed.
#   * hcs-sys-public-cloud
#   * hcs-sys-private-cloud
#   * hcs-sys-platform
# Subprojects can get destroyed individually.

project_subfolder="hcs_1"

folder_hcs_sys_public_cloud="${project_subfolder}/hcs-sys-public"
folder_hcs_sys_private_cloud="${project_subfolder}/hcs-sys-private"
folder_hcs_sys_platform="hcs-sys-platform"

INFRASTRUCTURE_ENVIRONMENTS="${folder_hcs_sys_public_cloud} ${folder_hcs_sys_private_cloud} ${folder_hcs_sys_platform}"

echo "${LIGHT_BLUE}DESTROY-MAIN: START WITH SHUTTING DOWN HYBRID-CLOUD...${NC}"
for infraPath in $INFRASTRUCTURE_ENVIRONMENTS
do
    echo "${LIGHT_BLUE}DESTROY-MAIN: DESRTOY ${infraPath}...${NC}"  
    cd $infraPath/
    ./destroy.sh
    cd ..
    cd ..
done
echo "${LIGHT_BLUE}DESTROY-MAIN: DONE WITH SHUTTING DOWN HYBRID-CLOUD${NC}"
