import fetch from "node-fetch";

exports.handler = async function(event, context) {
  const message = `Hey there **User**,  \nUser XYZ mentioned you in Guild chat at [Some Guild](https://habitica.com)\n\nThis notification was brought to you by **NotificaBot**`;
  await sendMessage(message)
    .then(() => console.log("success"))
    .catch(err => console.error(err));

  return {
    statusCode: 200,
    body: "OK"
  };
};

async function sendMessage(message) {
  try {
    const url = process.env.API_BASE_URL + "/members/send-private-message";
    const options = {
      method: "POST",
      body: JSON.stringify({ message, toUserId: process.env.USER_ID }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-user": process.env.USER_ID,
        "x-api-key": process.env.API_KEY
      }
    };

    //console.log("fetch", { url, options });

    const response = await fetch(url, options);

    if (!response.ok) {
      throw Error(
        `${response.status} ${response.statusText} "${await response.text()}"`
      );
    }

    return response.json();
  } catch (err) {
    return err;
  }
}
