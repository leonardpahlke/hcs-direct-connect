import { Post, Route } from "tsoa";
import { encodeSession } from "../auth/session";
import { secretKey } from "../config";
import { DefaultSessionTokenResponse } from "../models/default-response";
import { LegacySignUp } from "../request-legacy-sys";

@Route("sign-out/:username/:password")
export default class SignUpController {
  @Post("/")
  public async getMessage(
    username: string,
    password: string
  ): Promise<DefaultSessionTokenResponse> {
    return LegacySignUp(username, password).then((res) => {
      if (res) {
        const session = encodeSession(secretKey, {
          username: username,
          dateCreated: Date.now(),
        });
        return {
          message: "user signed-up",
          session: session,
          statusCode: 200,
        };
      } else {
        return {
          message: "user could not get signed-up",
          session: { token: "", expires: 0, issued: 0 },
          statusCode: 404,
        };
      }
    });
  }
}
