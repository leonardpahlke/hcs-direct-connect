GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo
echo 
echo "${GREEN}START HCS-SYS-PLATFORM - DEPLOY.SH ...${NC}"
echo
lambdaTimeoutInSeconds=60
requestHandlerEndpoint="https://www.google.com"

if [ $# -eq 2 ] 
then
    echo "Arguments supplied update defaults"

    $lambdaTimeoutInSeconds=$1
    $requestHandlerEndpoint=$2

    echo "updatd variable lambdaTimeoutInSeconds to: $lambdaTimeoutInSeconds"
    echo "updatd variable requestHandlerEndpoint to: $requestHandlerEndpoint"
elif [ $# -eq 0 ] 
then
    echo "${YELLOW}No arguments supplied, use default arguemnts${NC}"
else
    echo "${RED}Not enough arguments supplied, use defaults${NC}"
fi
# pulumi config set --path 'data.nums[2]' 3

echo "Set pulumi configuration..."
pulumi config set --path 'data.lambdaTimeoutInSeconds' $lambdaTimeoutInSeconds
pulumi config set --path 'data.requestHandlerEndpoint' $requestHandlerEndpoint
echo "Pulumi configuration set"
echo

echo "Deploy Pulumi project..."
pulumi up -y
echo "Pulumi project deployed"

echo
echo "${GREEN}FINISHED HCS-SYS-PLATFORM - DEPLOY.SH${NC}"
echo