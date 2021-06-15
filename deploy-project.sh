LIGHT_BLUE='\033[1;34m'
NC='\033[0m'

# This file will deploy the HCS system to the configured system.
# The deployment is based on the deployment diagram shown in the README.md file.
# The folowing three systems are getting deployed.
#   * hcs-sys-public-cloud
#   * hcs-sys-private-cloud
#   * hcs-sys-platform
# Subprojects can get deployed individually.
# The configuration has to get updated inline.
# Access to AWS is configured outside of this project scope (credentials file).

folder_hcs_sys_public_cloud="hcs-sys-public"
folder_hcs_sys_private_cloud="hcs-sys-private"
folder_hcs_sys_platform="hcs-sys-platform"

# CONFIGURATION

project_name="hcs"

echo
echo "${LIGHT_BLUE}DEPLOY-MAIN: START WITH HYBRID-CLOUD-DEPLOYMENT...${NC}"
echo

# DEPLOYMENT

# --------
# 1. create hcs-sys-private-cloud setup useing vagrant
echo "${LIGHT_BLUE}DEPLOY-MAIN: 1. create hcs-sys-private-cloud setup useing vagrant${NC}"
cd $folder_hcs_sys_private_cloud/
./deploy.sh
cd ..


# --------
# 2. create hcs-sys-public-cloud setup useing pulumi
echo "${LIGHT_BLUE}DEPLOY-MAIN: 2. create hcs-sys-public-cloud setup useing pulumi${NC}"
cd $folder_hcs_sys_public_cloud/
./deploy.sh
hcs_sys_public_albHostReqHandler=`pulumi stack output albHostReqHandler`
cd ..

# --------
# 3. create hcs-sys-platform-cloud setup useing pulumi
echo "${LIGHT_BLUE}DEPLOY-MAIN: 3. create hcs-sys-platform-cloud setup useing pulumi${NC}"
cd $folder_hcs_sys_platform/
./deploy.sh hcs_sys_public_albHostReqHandler
hcs_sys_platform_endpointUrl=`pulumi stack output endpointUrl`
cd ..

# todo... invoke with three variables: $requestHandlerHostname=$1, $requestHandlerPath=$2, $requestHandlerPort=$3


# --------
# 4. get public-ip adresses
# 4.1. get vm public-ip adress hcs-sys-public-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 4.1. get vm ip adresses hcs-sys-public-cloud${NC}"
cd $folder_hcs_sys_public_cloud/
hcs_sys_public_natInstancePublicIp=`pulumi stack output natInstancePublicIp`
cd ..

# --------
# 4.2. get vm public-ip adress hcs-sys-private-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 4.2. get vm ip adresses hcs-sys-private-cloud${NC}"
# ...

# --------
# 5. install hcs-sys-public-cloud gateway
echo "${LIGHT_BLUE}DEPLOY-MAIN: 5. install hcs-sys-public-cloud gateway${NC}"
cd $folder_hcs_sys_public_cloud/
./nat-gw-install.sh <vmPublicIp>
cd ..

# --------
# 6. get keys
# 6.1. get private key hcs-sys-public-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 6.1. get private and public keys hcs-sys-public-cloud${NC}"
# ...

# 6.2. get private key hcs-sys-private-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 6.2. get private and public keys hcs-sys-platform${NC}"
# ...

# --------
# 7. create vpn-tunnel beween private- and public-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 7. create vpn-tunnel beween private- and public-cloud${NC}"
# ...

# --------
# 8. check connection (use other file "check-connection.sh")
echo "${LIGHT_BLUE}DEPLOY-MAIN: 8. check connection${NC}"
./check-connection.sh hcs_sys_platform_endpointUrl

echo
echo "${LIGHT_BLUE}FINISHED WITH HYBRID-CLOUD-DEPLOYMENT${NC}"
echo
