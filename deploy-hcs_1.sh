LIGHT_BLUE='\033[1;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Project folder variables
project_subfolder="hcs_1"
folder_hcs_sys_public_cloud="./${project_subfolder}/hcs-sys-public"
folder_hcs_sys_private_cloud="./${project_subfolder}/hcs-sys-private"
folder_hcs_sys_platform="hcs-sys-platform"

# Ansible playbook variables
ansible_inventory_file="hosts"
ansible_inv_nat_gw_ref="reqhandler"
ansible_inv_legacy_sys_ref="legacysys"

# Public Cloud Gateway Variables
nat_gw_user="ubuntu"
nat_gw_pk="~/.ssh/hcs-nat-key.pem"

requestHandlerPath="/health-check-connection"
requestHandlerPort=8000
legacyComponentPort=8050

# VPN Connection variables
vpnPort=51820
vpnClientIp="10.50.0.2"
vpnClientIpCidrStart="10.50.0.1"

wgPrivateIpServer="10.50.0.1"
wgPrivateIpClient="10.50.0.2"

hcs_wg_install_file="wg_install.sh"

project_path=$(pwd)

echo
echo "${LIGHT_BLUE}DEPLOY-MAIN: START WITH HYBRID-CLOUD-DEPLOYMENT...${NC}"
echo

echo "${GREEN}CHECK Installations${NC}"
docker ps || {
    echo "${RED} FAILED: Docker is not running ${NC}"
    exit 1
}
doctl account get || {
    echo "${RED} FAILED: DOCTL is not setup ${NC}"
    exit 1
}

echo "${GREEN}...proceed with deployment${NC}"
echo

# DEPLOYMENT

# --------
# 1. create hcs-sys-private-cloud setup useing vagrant
echo "${LIGHT_BLUE}DEPLOY-MAIN: 1. create hcs-sys-private-cloud setup useing vagrant${NC}"
cd $folder_hcs_sys_private_cloud
./deploy.sh
cd $project_path

# --------
# 2. create hcs-sys-public-cloud setup useing pulumi
echo "${LIGHT_BLUE}DEPLOY-MAIN: 2. create hcs-sys-public-cloud setup useing pulumi${NC}"
cd $folder_hcs_sys_public_cloud
./deploy.sh
hcs_sys_public_albHostReqHandler=$(pulumi stack output albHostReqHandler)
cd $project_path

# --------
# 3. create hcs-sys-platform-cloud setup useing pulumi
echo "${LIGHT_BLUE}DEPLOY-MAIN: 3. create hcs-sys-platform-cloud setup useing pulumi${NC}"
cd $folder_hcs_sys_platform
./deploy.sh $hcs_sys_public_albHostReqHandler $requestHandlerPath $requestHandlerPort
hcs_sys_platform_endpointUrl=$(pulumi stack output endpointUrl)
cd $project_path

# --------
# 4. get public-ip adresses
# 4.1. get vm public-ip adress hcs-sys-public-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 4.1. get vm public ip adresses hcs-sys-public-cloud${NC}"
cd $folder_hcs_sys_public_cloud
hcs_sys_public_natInstancePublicIp=$(pulumi stack output natInstancePublicIp)
echo "$ansible_inv_nat_gw_ref public-ip: $hcs_sys_public_natInstancePublicIp"
cd $project_path

# --------
# 4.2. get vm public-ip adress hcs-sys-private-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 4.2. get vm public ip adresses hcs-sys-private-cloud${NC}"
cd $folder_hcs_sys_private_cloud
hcs_sys_private_legacySysPublicIp=$(vagrant ssh -c 'curl ipecho.net/plain')
echo "$ansible_inv_legacy_sys_ref public-ip: $hcs_sys_private_legacySysPublicIp"
cd $project_path

echo "${LIGHT_BLUE}Set hosts for ansible playbook${NC}"
echo "[servers]
$ansible_inv_nat_gw_ref ansible_host=$hcs_sys_public_natInstancePublicIp
$ansible_inv_legacy_sys_ref ansible_host=$hcs_sys_private_legacySysPublicIp

[servers:vars]
ansible_python_interpreter=/usr/bin/python3" >$ansible_inventory_file

# --------
# 5. install hcs-sys-public-cloud gateway
echo "${LIGHT_BLUE}DEPLOY-MAIN: 5. install hcs-sys-public-cloud gateway${NC}"
ansible-playbook playbook-hcs-public-install.yaml -l $ansible_inv_nat_gw_ref -u $nat_gw_user -i $ansible_inventory_file --private-key $nat_gw_pk -e "vpnPort=$vpnPort"

# --------
# 6. get keys
# 6.1. get private key hcs-sys-public-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 6.1. get private- and public-keys hcs-sys-public-cloud${NC}"
server_private_key=$(ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp 'sudo cat /etc/wireguard/server_private.key')
server_public_key=$(ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp 'sudo cat /etc/wireguard/server_public.key')
#echo "${LIGHT_BLUE}Retrived server key's: ${server_private_key}, ${server_public_key}${NC}"

# 6.2. get private key hcs-sys-private-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 6.2. get private- and public-keys hcs-sys-private-cloud${NC}"
cd $folder_hcs_sys_private_cloud
client_private_key=$(vagrant ssh -c 'sudo cat /etc/wireguard/client_private.key')
client_public_key=$(vagrant ssh -c 'sudo cat /etc/wireguard/client_public.key')
cd $project_path
#echo "${LIGHT_BLUE}Retrived client key's: ${client_private_key}, ${client_public_key}${NC}"

# --------
# 7.1. create vpn-tunnel public-cloud (server)
echo "${LIGHT_BLUE}DEPLOY-MAIN: 7.1. create vpn-tunnel public-cloud (server)${NC}"
# Create local interface config files
echo "[Interface]
PrivateKey = $server_private_key
Address = $wgPrivateIpServer/24
ListenPort = $vpnPort

[Peer]
PublicKey = $client_public_key
AllowedIPs = $wgPrivateIpClient/32" >./wg0.conf
chmod +x ./wg0.conf
ansible-playbook playbook-hcs-wg.yaml -l $ansible_inv_nat_gw_ref -u $nat_gw_user -i $ansible_inventory_file --private-key $nat_gw_pk

# --------
# 7.2. create vpn-tunnel private-cloud (client)
echo "${LIGHT_BLUE}DEPLOY-MAIN: 7.2. create vpn-tunnel private-cloud${NC}"
cd $folder_hcs_sys_private_cloud
# Setup interface file
vagrant ssh -c "sudo sh /vagrant/$hcs_wg_install_file wg0.conf $client_private_key $server_public_key $wgPrivateIpClient $vpnPort $hcs_sys_public_natInstancePublicIp $wgPrivateIpServer"
# Start interface
vagrant ssh -c "sudo wg-quick up wg0"
# Start interface config at reboot
vagrant ssh -c "sudo systemctl enable wg-quick@wg0.service"
# Verify config
vagrant ssh -c "sudo wg"
cd $project_path

echo
echo "Now you should be able to connect vise versa between each virtual machines, 
\n${LIGHT_BLUE}[A]${NC} if you like to check the connection from the private cloud thowards the public cloud
\n ${YELLOW}1.${NC} connect to the vm over the connnect.sh script and 
\n ${YELLOW}2.${NC} ping $wgPrivateIpClient 
\n${LIGHT_BLUE}[B]${NC} if you like to to it the other way around and test the connection from the public cloud to the private cloud
\n ${YELLOW}1.${NC} connect to the vm over the connnect.sh script and 
\n ${YELLOW}2.${NC} ping $wgPrivateIpServer"
echo
