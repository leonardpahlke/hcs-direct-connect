import { Post, Route } from "tsoa";
import { searchForUser } from "../data/users";

interface SignInResponse {
  message: string;
  statusCode: number;
}

@Route("sign-in")
export default class SignInController {
  @Post("/:username/:password")
  public async getMessage(
    username: string,
    password: string
  ): Promise<SignInResponse> {
    if (searchForUser(username, password)) {
      return {
        message: "user signed in",
        statusCode: 200,
      };
    } else {
      return {
        message: "user not found",
        statusCode: 404,
      };
    }
  }
}
