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
folder_hcs_sys_public_cloud="hcs-sys-public"
folder_hcs_sys_private_cloud="hcs-sys-private"
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

# VPN Connection variables
vpnPort=51280
vpnClientIp="10.50.0.2"
vpnClientIpCidrStart="10.50.0.1"
interface_name="wg0"
interface_file="$interface_name.conf"


# CONFIGURATION

project_name="hcs"

echo
echo "${LIGHT_BLUE}DEPLOY-MAIN: START WITH HYBRID-CLOUD-DEPLOYMENT...${NC}"
echo


echo "CHECK Installations"
docker ps || { echo "${RED} FAILED: Docker is not running ${NC}" ; exit 1; }
doctl account get || { echo "${RED} FAILED: DOCTL is not setup ${NC}" ; exit 1; }

echo "${GREEN}...proceed with deployment${NC}"

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
./deploy.sh hcs_sys_public_albHostReqHandler $requestHandlerPath $requestHandlerPort
hcs_sys_platform_endpointUrl=`pulumi stack output endpointUrl`
cd ..

# todo... invoke with three variables: $requestHandlerHostname=$1, $requestHandlerPath=$2, $requestHandlerPort=$3

# --------
# 4. get public-ip adresses
# 4.1. get vm public-ip adress hcs-sys-public-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 4.1. get vm ip adresses hcs-sys-public-cloud${NC}"
cd $folder_hcs_sys_public_cloud/
hcs_sys_public_natInstancePublicIp=`pulumi stack output natInstancePublicIp`
echo "$ansible_inv_nat_gw_ref public-ip: $hcs_sys_public_natInstancePublicIp"
cd ..

# --------
# 4.2. get vm public-ip adress hcs-sys-private-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 4.2. get vm ip adresses hcs-sys-private-cloud${NC}"
cd $folder_hcs_sys_private_cloud/
hcs_sys_private_legacySysPublicIp=`vagrant ssh -c 'curl ipecho.net/plain'`
echo "$ansible_inv_legacy_sys_ref public-ip: $hcs_sys_private_legacySysPublicIp"
cd ..


echo "${LIGHT_BLUE}Set hosts for ansible playbook${NC}"
echo "[servers]
$ansible_inv_nat_gw_ref ansible_host=$hcs_sys_public_natInstancePublicIp
$ansible_inv_legacy_sys_ref ansible_host=$hcs_sys_private_legacySysPublicIp

[servers:vars]
ansible_python_interpreter=/usr/bin/python3" > $ansible_inventory_file

# --------
# 5. install hcs-sys-public-cloud gateway
echo "${LIGHT_BLUE}DEPLOY-MAIN: 5. install hcs-sys-public-cloud gateway${NC}"
ansible-playbook playbook-hcs-public-install.yaml -l $ansible_inv_nat_gw_ref -u $nat_gw_user -i $ansible_inventory_file --private-key $nat_gw_pk -e "vpnPort=$vpnPort"
# ansible-playbook playbook-hcs-public-install.yaml -l reqhandler -u ubuntu -i hosts --private-key "~/.ssh/hcs-nat-key.pem" -e "vpnPort=51280"

# --------
# 6. get keys
# 6.1. get private key hcs-sys-public-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 6.1. get private and public keys hcs-sys-public-cloud${NC}"
server_private_key=`ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp 'sudo cat /etc/wireguard/server_private.key'`
server_public_key=`ssh -i $nat_gw_pk $nat_gw_user@$hcs_sys_public_natInstancePublicIp 'sudo cat /etc/wireguard/server_public.key'`

# 6.2. get private key hcs-sys-private-cloud
echo "${LIGHT_BLUE}DEPLOY-MAIN: 6.2. get private and public keys hcs-sys-platform${NC}"
cd $folder_hcs_sys_private_cloud/
client_private_key=`vagrant ssh -c 'sudo cat /etc/wireguard/client_private.key'`
client_public_key=`vagrant ssh -c 'sudo cat /etc/wireguard/client_public.key'`
cd ..


# --------
# 7.1. create vpn-tunnel beween private-cloud (client)
echo "${LIGHT_BLUE}DEPLOY-MAIN: 7.1. create vpn-tunnel beween private-cloud${NC}"
# Create local interface config files
echo `[Interface]
PrivateKey = $client_private_key
Address = $vpnClientIp/24
DNS = 8.8.8.8

[Peer]
PublicKey = $server_public_key
AllowedIPs = 0.0.0.0/0
Endpoint = $hcs_sys_private_legacySysPublicIp:$vpnPort
PersistentKeepalive = 25
` > ~/$interface_file
chmod +X ~/$interface_file
ansible-playbook playbook-hcs-wg.yaml -l $ansible_inv_legacy_sys_ref -u $nat_gw_user -i $ansible_inventory_file --private-key $nat_gw_pk -e "interface_file=$interface_file"

# --------
# 7.2. create vpn-tunnel beween public-cloud (server)
echo "${LIGHT_BLUE}DEPLOY-MAIN: 7.2. create vpn-tunnel beween public-cloud (server)${NC}"
# Create local interface config files
echo `[Interface]
PrivateKey = $server_private_key
Address = $vpnClientIpCidrStart/24
ListenPort = $vpnPort

PostUp = iptables -A FORWARD -i $interface_name -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i $interface_name -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $client_public_key
AllowedIPs = $vpnClientIp/32
` > ~/$interface_file
chmod +X ~/$interface_file
ansible-playbook playbook-hcs-public-wg.yaml -l $ansible_inv_nat_gw_ref -u $nat_gw_user -i $ansible_inventory_file --private-key $nat_gw_pk -e "interface_file=$interface_file"

# --------
# 8. check connection (use other file "check-connection.sh")
echo "${LIGHT_BLUE}DEPLOY-MAIN: 8. check connection${NC}"
./check-connection.sh hcs_sys_platform_endpointUrl

echo
echo "${LIGHT_BLUE}FINISHED WITH HYBRID-CLOUD-DEPLOYMENT${NC}"
echo