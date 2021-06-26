GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
LIGHT_BLUE='\033[1;34m'

echo
echo 
echo "${LIGHT_BLUE}START WG-SERVER-INSTALL.SH ...${NC}"
echo

vpnPort=51280
vpnClientIp="10.50.0.2"
vpnClientIpCidrStart="10.50.0.1"

serverPrivateKey="XXX"
clientPublicKey="XXX"
publicIpServer="0.0.0.0"

if [ $# -eq 3 ] 
then
    echo "Arguments supplied update variables"

    serverPrivateKey=&1
    clientPublicKey=&2
    publicIpServer=&3

    echo "updatd variable serverPrivateKey to: $serverPrivateKey"
    echo "updatd variable clientPublicKey to: $clientPublicKey"
    echo "updatd variable publicIpServer to: $publicIpServer"
else
    echo "${RED}Not enough arguments supplied, cannot use defaults${NC}"
    exit 3
fi

echo "Create client interface wg0.conf file locally"
echo `
[Interface]
PrivateKey = $serverPrivateKey
Address = $vpnClientIpCidrStart/24
ListenPort = $vpnPort

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $clientPublicKey
AllowedIPs = $vpnClientIp/32
` > wg0.conf
chmod +x wg0.conf
echo "Send wg0.conf file to VM (/etc/wireguard/wg0.conf)"
sudo scp ./wg0.conf ubuntu@<IP-address>:/etc/wireguard/wg0.conf
echo "Start WireGuard Server Interface"
sudo systemctl start wg-quick@wg0


echo
echo "${LIGHT_BLUE}FINISHED WG-SERVER-INSTALL.SH${NC}"
echo