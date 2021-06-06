import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { GetTags } from "../util";

/**
 * CONFIGURATION
 */

// Get pulumi configuration to enable dynamic deployments
let config = new pulumi.Config();

// Structured configuration input https://www.pulumi.com/docs/intro/concepts/config/#structured-configuration
interface Data {
  projectName: string;
  lambdaTimeoutInSeconds: number;
  requestHandlerEndpoint: string;
}

let configData = config.requireObject<Data>("data");

let projectName = configData.projectName || "hcs-sys-platform";
let lambdaTimeoutInSeconds = configData.lambdaTimeoutInSeconds || 60;
let requestHandlerEndpoint = configData.requestHandlerEndpoint || "";

/**
 * SERVICE DEFINITIONS
 */

// Create a role wich the lambda gets associated with
const role = new aws.iam.Role(projectName + "-lmb-role", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
  tags: GetTags(projectName + "-lmb-role"),
});

// Create policy to allow the lambda to write logs to cloudwatch
const lmbPolicy = new aws.iam.RolePolicy(projectName + "-lmb-policy", {
  role,
  policy: pulumi.output({
    Version: "2012-10-17",
    Statement: [
      {
        Action: ["logs:*", "cloudwatch:*"],
        Resource: "*",
        Effect: "Allow",
      },
    ],
  }),
});

// Create an REST API-Gateway
const endpoint = new awsx.apigateway.API(
  projectName + "-rest-api-gw",
  {
    routes: [
      {
        path: "/{route+}",
        method: "POST",
        // create lambda function which handles requests
        eventHandler: new aws.lambda.Function(projectName + "-lmb", {
          // reference node runtime
          runtime: aws.lambda.NodeJS12dXRuntime,
          // import lambda function code
          code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive(
              "./lambda-code/health-checker/handler"
            ),
          }),
          // overwrite default timeout
          timeout: lambdaTimeoutInSeconds,
          // set code endtrypoint
          handler: "health_checker_handler",
          // assign role to lambda (this role allows the lambda to write logs to cloudwatch)
          role: role.arn,
          // send lambda environemnt variables
          environment: {
            variables: { ENDPOINT: requestHandlerEndpoint },
          },
          tags: GetTags(projectName + "-lmb"),
        }),
      },
    ],
  },
  // this lambda depends on the policy it get associated with (the policy gets added to the role directly)
  { dependsOn: [lmbPolicy] }
);

/**
 * OUTPUT
 */

// See these outputs using: pulumi stack output endpointUrl
export const endpointUrl = endpoint.url;
