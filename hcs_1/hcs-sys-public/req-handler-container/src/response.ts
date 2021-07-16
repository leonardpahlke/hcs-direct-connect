import { runtimeConfig } from "../src/config";

/**
 * DefaultResponse: default response interface
 */
export interface DefaultResponse {
  message: string;
  statusCode: number;
}

/**
 * HealthCheckConnectionResponse: health check connection response interface
 */
export interface HealthCheckConnectionResponse {
  message: string;
  legacySystemResponse: DefaultResponse;
  statusCode: number;
}

/**
 * SysInfoResponse: system information response interface
 */
export interface SysInfoResponse {
  message: string;
  config: runtimeConfig;
}
