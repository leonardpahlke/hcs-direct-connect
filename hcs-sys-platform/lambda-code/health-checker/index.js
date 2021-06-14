const http = require("http");
// get health-check url from environment variables
let hostname = process.env.HOSTNAME;
let port = process.env.PORT;
let path = process.env.PATH;

const data = JSON.stringify({});

const options = {
  hostname: hostname,
  port: port,
  path: path,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

/**
 * This handler function is the entry point for the health-checker lambda function
 * The lambda function sends a health-check request to the req-handler-container endpoint
 * @param {*} event
 * @returns The response indicates via the status code whether the health check was successful with a descriptive message
 */
exports.handler = async function (event) {
  console.log("START HEALTH-CHECK");
  // send health-check request to req-handler endpoint
  const promise = new Promise(function (resolve, reject) {
    const req = http.request(options, (res) => {
      console.log("received response");
      resolve({
        statusCode: res.statusCode,
        body: JSON.stringify({
          message: `HEALTH-CHECK response: ${res.body}`,
        }),
      });
    });

    req.on("error", (error) => {
      console.error(error);
      reject({
        statusCode: 500,
        body: JSON.stringify({
          error: `HEALTH-CHECK error response: ${error}`,
        }),
      });
    });

    req.write(data);
    req.end();
  });
  console.log("END HEALTH-CHECK");
  return promise;
};
