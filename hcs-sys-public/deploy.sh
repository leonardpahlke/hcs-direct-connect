GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo
echo 
echo "${GREEN}START HCS-SYS-PUBLIC - DEPLOY.SH ...${NC}"
echo
albClusterReqHandlerPort=8000
clusterReqHandlerDesiredAmount=1
clusterReqHandlerMemory=128
# Name of the key that is getting used to log in to the ec2 instance
keyPairName="hcs-nat-key"
awsregion="eu-central-1"

if [ $# -eq 3 ] 
then
    echo "Arguments supplied update defaults"

    $albClusterReqHandlerPort=$1
    $clusterReqHandlerDesiredAmount=$2
    $clusterReqHandlerMemory=$3

    echo "updatd variable albClusterReqHandlerPort to: $albClusterReqHandlerPort"
    echo "updatd variable clusterReqHandlerDesiredAmount to: $clusterReqHandlerDesiredAmount"
    echo "updatd variable clusterReqHandlerMemory to: $clusterReqHandlerMemory"
elif [ $# -eq 0 ] 
then
    echo "${YELLOW}No arguments supplied; use default arguments${NC}"
else
    echo "${RED}Not enough arguments supplied; use defaults${NC}"
fi

#echo "Create key-pair to connect to EC2 Instance"
# Create EC2 key-pair and create a local copy
#aws ec2 create-key-pair --region $awsregion --key-name $keyPairName --query "KeyMaterial" --output yaml > $keyPairName.pem
# Check if key got created correct
#keypairMaterial=`yq eval ".KeyPairs.[] | .KeyMaterial" $keyPairName.yaml`
# Write key into new file
#echo keypairMaterial > $keyPairName.pem
# Update read permissions
#chmod 400 $keyPairName.pem
# Move new key to ~.ssh folder
#mv -f $keyPairName.pem ~/.ssh/$keyPairName.pem
# Delete temp file
#rm $keyPairName.yaml
#echo "Key-pair '$keyPairName' created"

echo "Set pulumi configuration..."
pulumi config set --path 'data.albClusterReqHandlerPort' $albClusterReqHandlerPort
pulumi config set --path 'data.clusterReqHandlerDesiredAmount' $clusterReqHandlerDesiredAmount
pulumi config set --path 'data.clusterReqHandlerMemory' $clusterReqHandlerMemory
pulumi config set --path 'data.keyPairName' $keyPairName
echo "Pulumi configuration set"
echo

echo "Deploy Pulumi project..."
pulumi up -y
echo "Pulumi project deployed"

echo
echo "${GREEN}FINISHED HCS-SYS-PUBLIC - DEPLOY.SH${NC}"
echo