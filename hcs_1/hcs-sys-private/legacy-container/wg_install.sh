# This file is getting used to create and install the wireguard interface
#  This scripts is getting executed during deployment
interface_file=$1
client_private_key=$2
server_public_key=$3
wgPrivateIpClient=$4
vpnPort=$5
serverPublicIp=$6
wgPrivateIpServer=$7

sudo echo "[Interface]
PrivateKey = $client_private_key
Address = $wgPrivateIpClient/24

[Peer]
PublicKey = $server_public_key
AllowedIPs = $wgPrivateIpServer/32
Endpoint = $serverPublicIp:$vpnPort
PersistentKeepalive = 21" >/etc/wireguard/$interface_file
echo "$interface_file file created"
