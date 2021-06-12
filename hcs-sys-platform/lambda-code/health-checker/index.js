const https = require("https");
// get health-check url from environment variables
let url = process.env.ENDPOINT;

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
    https
      .post(url, (res) => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.stringify({
            message: `HEALTH-CHECK response: ${res.body}`,
          }),
        });
      })
      .on("error", (e) => {
        reject({
          statusCode: 500,
          body: JSON.stringify({
            error: `HEALTH-CHECK error response: ${Error(e)}`,
          }),
        });
      });
  });
  console.log("END HEALTH-CHECK");
  return promise;
};
