echo "CONNECT TO INSTANCE HCS-SYS-PRIVATE-2"

ip=`terraform output -raw floating_ipv4`
keyFile="~/.ssh/id_rsa_hcs"
echo "Connect to ${ip} with key ${keyFile}"
ssh -o "StrictHostKeyChecking no" -i $keyFile root@$ip