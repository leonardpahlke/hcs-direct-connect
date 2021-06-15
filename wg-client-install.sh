GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
LIGHT_BLUE='\033[1;34m'

echo
echo 
echo "${LIGHT_BLUE}START WG-CLIENT-INSTALL.SH ...${NC}"
echo

vpnPort=51280
vpnClientIp="10.50.0.2"

clientPrivateKey="XXX"
serverPublicKey="XXX"
publicIpServer="0.0.0.0"

if [ $# -eq 3 ] 
then
    echo "Arguments supplied update variables"

    $clientPrivateKey=&1
    $serverPublicKey=&2
    $publicIpServer=&3

    echo "updatd variable clientPrivateKey to: $clientPrivateKey"
    echo "updatd variable serverPublicKey to: $serverPublicKey"
    echo "updatd variable publicIpServer to: $publicIpServer"
else
    echo "${RED}Not enough arguments supplied, cannot use defaults${NC}"
    exit 3
fi

echo "Create client interface wg0.conf file locally"
echo `
[Interface]
PrivateKey = $clientPrivateKey
Address = $vpnClientIp/24
DNS = 8.8.8.8

[Peer]
PublicKey = $serverPublicKey
AllowedIPs = 0.0.0.0/0
Endpoint = $publicIpServer:$vpnPort
PersistentKeepalive = 25
` > wg0.conf
chmod +x wg0.conf
echo "Send wg0.conf file to VM (/etc/wireguard/wg0.conf)"
sudo scp ./wg0.conf ubuntu@<IP-address>:/etc/wireguard/wg0.conf
echo "Start WireGuard Client interface"
sudo wg-quick up wg0


echo
echo "${LIGHT_BLUE}FINISHED WG-CLIENT-INSTALL.SH${NC}"
echo