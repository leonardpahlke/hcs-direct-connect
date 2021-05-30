# set config variables
dockerhubusername="leonardpahlke"
baseimagename="hcs-req-handler-prod"

echo "----- SH -----"
echo "START --> request-handler-container/push-docker-image"
echo

# log in to docker
docker login

# build docker image and tag it with latest tag
docker build -f Dockerfile.prod -t $baseimagename .

# tag docker image
docker tag $baseimagename $dockerhubusername/$baseimagename

# push image to docker hub
docker push $dockerhubusername/$baseimagename

echo 
echo "request-handler-container/push-docker-image <-- END"
echo "----- SH -----"