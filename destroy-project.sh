LIGHT_BLUE='\033[1;34m'
NC='\033[0m'

# This file will destroy the HCS system to the configured system.
# The folowing three systems are getting destroyed.
#   * hcs-sys-public-cloud
#   * hcs-sys-private-cloud
#   * hcs-sys-platform
# Subprojects can get destroyed individually.

folder_hcs_sys_public_cloud="hcs-sys-public"
folder_hcs_sys_private_cloud="hcs-sys-private"
folder_hcs_sys_platform="hcs-sys-platform"

# CONFIGURATION

project_name="hcs"

echo
echo "${LIGHT_BLUE}DESTROY-MAIN: START WITH SHUTTING DOWN HYBRID-CLOUD...${NC}"
echo

# SHUTTING DOWN

# --------
# 1. create hcs-sys-private-cloud setup useing vagrant
echo "${LIGHT_BLUE}DESTROY-MAIN: 1. destroy hcs-sys-private-cloud setup useing vagrant${NC}"
cd $folder_hcs_sys_private_cloud/
./destroy.sh
cd ..


# --------
# 2. create hcs-sys-public-cloud setup useing pulumi
echo "${LIGHT_BLUE}DESTROY-MAIN: 2. destroy hcs-sys-public-cloud setup useing pulumi${NC}"
cd $folder_hcs_sys_public_cloud/
./destroy.sh
cd ..

# --------
# 3. create hcs-sys-platform-cloud setup useing pulumi
echo "${LIGHT_BLUE}DESTROY-MAIN: 3. destroy hcs-sys-platform-cloud setup useing pulumi${NC}"
cd $folder_hcs_sys_platform/
./destroy.sh
cd ..

echo
echo "${LIGHT_BLUE}FINISHED WITH SHUTTING DOWN HYBRID-CLOUD${NC}"
echo
