GREEN='\033[0;32m'
NC='\033[0m'
keyPairIdName="hcs-gw-key"
awsregion="eu-central-1"

echo
echo
echo "${GREEN}START HCS-SYS-PUBLIC - DESTROY.SH${NC}"
echo

pulumi destroy -f
#aws ec2 delete-key-pair --key-name $keyPairIdName --region $awsregion
#rm ~/.ssh/hcs-gw-key.pem --force

echo
echo "${GREEN}FINISHED HCS-SYS-PUBLIC - DESTROY.SH${NC}"
echo