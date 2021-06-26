GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# This key is used to access the VM
vmKeyFile="~/.ssh/hcs-nat-key.pem"
vmUser="ubuntu"
vmPublicIp="0.0.0.0"

echo
echo 
echo "${GREEN}START HCS-SYS-PUBLIC - NAT-GW-INSTALL.SH ...${NC}"
echo

if [ $# -eq 1 ] 
then
    echo "Arguments supplied update variables"

    vmPublicIp=$1

    echo "updatd variable vmPublicIp to: $vmPublicIp"
else
    echo "${RED}No Public-Ip supplied and cannot use defaults${NC}"
    exit 3
fi

ssh -i $vmKeyFile $vmUser@$vmPublicIp || { echo "${RED} FAILED: Could not connect to VM 'ssh -i $vmKeyFile $vmUser@$vmPublicIp' ${NC}" ; exit 1; }
echo "Update VM"
sudo apt update -y
echo "Install wireguard"
sudo apt install wireguard
echo "Allow UDP traffic to VPN port"
sudo ufw allow 51820/udp
echo "Allow redirection of network packets at kernel level"
sudo net.ipv4.ip_forward=1 > /etc/sysctl.conf
echo "Apply changes"
sudo sysctl -p
echo "Create public- and private-key for vpn connection"
wg genkey | sudo tee /etc/wireguard/server_private.key | wg pubkey | sudo tee /etc/wireguard/server_public.key
echo "Update read/write settings for private-key file"
sudo chmod 600 /etc/wireguard/server_private.key

echo
echo "${GREEN}FINISHED HCS-SYS-PUBLIC - NAT-GW-INSTALL.SH${NC}"
echo
