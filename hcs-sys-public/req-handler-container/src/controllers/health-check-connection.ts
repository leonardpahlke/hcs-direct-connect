import requestPromise from "request-promise";
import { Post, Route } from "tsoa";
import { currentRuntimeConfig as runtimeConfig } from "../config";
import { HealthCheckConnectionResponse } from "../response";

@Route("health-check-connection")
export default class SignInController {
  @Post("/")
  public async runHealthCheckConnection(): Promise<HealthCheckConnectionResponse> {
    const legacyPingEndpoint = `http://${runtimeConfig.legacySysPrivateIp}:${runtimeConfig.legacySysPort}/ping`;

    // send ping request to legacy container
    return requestPromise(legacyPingEndpoint)
      .then(function () {
        return {
          message: "Request handler response",
          legacySystemResponse: {
            message: "Legacy system response",
            statusCode: 200,
          },
          statusCode: 200,
        };
      })
      .catch(function () {
        return {
          message: "Request handler response",
          legacySystemResponse: {
            message: "Legacy system response error received",
            statusCode: 404,
          },
          statusCode: 200,
        };
      });
  }
}
