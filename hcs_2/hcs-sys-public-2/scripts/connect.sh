echo "Connect to HCS-PUBLIC-CLOUD-2 REQUEST_HANDLER VM"

zone=`pulumi stack output instance_zone`
instance_name=`pulumi stack output instance_name`
project_name=`pulumi stack output project_name`

echo "With info: ${zone}, ${instance_name}, ${project_name}"

gcloud beta compute ssh --zone $zone $instance_name --tunnel-through-iap --project $project_name


