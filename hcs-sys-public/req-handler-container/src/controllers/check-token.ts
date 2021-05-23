import { Post, Route } from "tsoa";
import { DefaultResponse } from "../models/default-response";
import { decodeSession, checkExpirationStatus } from "../auth/session";
import { secretKey } from "../config";

@Route("check-token")
export default class CheckTokenController {
  @Post("/:token")
  public async getMessage(token: string): Promise<DefaultResponse> {
    const decodeResult = decodeSession(secretKey, token);
    if (decodeResult.type !== "valid") {
      return {
        message: decodeResult.type,
        statusCode: 404,
      };
    }

    const status = checkExpirationStatus(decodeResult.session);
    return {
      message: status,
      statusCode: 200,
    };
  }
}
