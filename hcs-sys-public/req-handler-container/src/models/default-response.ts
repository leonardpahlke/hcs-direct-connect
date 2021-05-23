import { EncodeResult } from "../auth/interface-token";
export interface DefaultResponse {
  message: string;
  statusCode: number;
}

export interface DefaultSessionTokenResponse {
  message: string;
  session: EncodeResult;
  statusCode: number;
}
