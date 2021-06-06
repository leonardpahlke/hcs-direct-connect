import * as aws from "@pulumi/aws";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

/**
 * A simple function that returns the request.
 * @param APIGatewayProxyEvent event
 * @returns returns a confirmation to the message to the
 */
export const health_checker_handler: aws.lambda.EventHandler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event) => {
  const route = event.pathParameters!["route"];
  const body = event.body ? JSON.parse(event.body) : null;

  console.log("Received body: ", body);

  return {
    statusCode: 200,
    body: JSON.stringify({
      route,
      message: "Hello World!",
      requestBodyEcho: body,
    }),
  };
};

export default health_checker_handler;
