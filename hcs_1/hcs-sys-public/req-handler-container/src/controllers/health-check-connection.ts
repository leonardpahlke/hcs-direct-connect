import axios, { AxiosError, AxiosResponse } from "axios";
import { Post, Route } from "tsoa";
import { currentRuntimeConfig as runtimeConfig } from "../config";
import { HealthCheckConnectionResponse } from "../response";

@Route("health-check-connection")
export default class SignInController {
  @Post("/")
  public async runHealthCheckConnection(): Promise<HealthCheckConnectionResponse> {
    const legacyPingEndpoint = `http://${runtimeConfig.legacySysPrivateIp}:${runtimeConfig.legacySysPort}/ping`;

    // send ping request to legacy container
    return axios
      .get(legacyPingEndpoint)
      .then(function (response: AxiosResponse) {
        return {
          message: "Request handler response",
          legacySystemResponse: {
            message: "Legacy system response, " + response.statusText,
            statusCode: 200,
          },
          statusCode: 200,
        };
      })
      .catch(function (error: AxiosError) {
        return {
          message: "Request handler response",
          legacySystemResponse: {
            message: "Legacy system response error received, " + error.message,
            statusCode: 404,
          },
          statusCode: 200,
        };
      });
  }
}
