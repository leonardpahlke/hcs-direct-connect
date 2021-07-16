# This file is getting used to create and install the wireguard interface
#  This scripts is getting executed during deployment
interface_file=$1
client_private_key=$2
server_public_key=$3
vpnClientIp=$4
vpnPort=$5
legacySysPublicIp=$6

echo "Create $interface_file file"
sudo echo "[Interface]
PrivateKey = $client_private_key
Address = $vpnClientIp/24
DNS = 8.8.8.8

[Peer]
PublicKey = $server_public_key
AllowedIPs = 0.0.0.0/0
Endpoint = $legacySysPublicIp:$vpnPort
PersistentKeepalive = 25" > /etc/wireguard/$interface_file
echo "$interface_file file created"

sudo chmod +x /etc/wireguard/$interface_file

echo "Start Interface"
sudo wg-quick up wg0