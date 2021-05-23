interface DataUser {
  username: string;
  password: string;
}

var userList: Array<DataUser> = [
  {
    username: "lpahlke",
    password: "test",
  },
];

export function getUserNames(): string {
  var strOfUsernames = "";
  for (var user of userList) {
    strOfUsernames = strOfUsernames + " " + user.username;
  }
  return strOfUsernames;
}

export function createUser(username: string, password: string): number {
  return userList.push({ username: username, password: password });
}

export function searchForUser(username: string, password: string): boolean {
  const searchedUser: DataUser = { username: username, password: password };
  let userFound = false;
  for (var user of userList) {
    if (
      user.username === searchedUser.username &&
      user.password === searchedUser.password
    ) {
      userFound = true;
      break;
    }
  }
  return userFound;
}
