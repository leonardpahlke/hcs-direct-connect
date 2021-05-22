import { Post, Route } from "tsoa";
import { searchForUser, createUser } from "../data/users";

interface SignUpResponse {
  message: string;
  statusCode: number;
}

@Route("sign-up/:username/:password")
export default class SignUpController {
  @Post("/")
  public async getMessage(
    username: string,
    password: string
  ): Promise<SignUpResponse> {
    // check if user already exists
    if (searchForUser(username, password)) {
      return {
        message: "user already exists",
        statusCode: 404,
      };
    }

    createUser(username, password);
    return {
      message: "user signed up",
      statusCode: 200,
    };
  }
}
