import fetch from "node-fetch";

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const params = JSON.parse(event.body);
  //console.log(params);

  /**
   * Format of the incoming params:
   * {
   *    group: {
   *      id: 'uuid-of-the-guild',
   *      name: 'Guild/Party Name'
   *    },
   *    chat: {
   *      id: 'uuid-of-the-message',
   *      text: 'Message text',
   *      timestamp: '2019-01-01T01:01:01.599Z',
   *      uuid: 'uuid-of-the-sender-user',
   *      user: 'Sender display name',
   *      username: 'Sender username',
   *      ...
   *    },
   *    webhookType: 'groupChatReceived',
   *    user: { _id: 'uuid-of-the-webhook-owner-user' }
   * }
   */
  if (
    !params ||
    !params.group ||
    !params.group.name ||
    !params.chat ||
    !params.chat.text ||
    !params.chat.user
  ) {
    return { statusCode: 400, body: "Bad Request" };
  }

  // TODO save in some db etc.
  const subscriptions = JSON.parse(process.env.SUBSCRIPTIONS);

  const promises = subscriptions
    .filter(user => params.chat.text.includes(`@${user.name}`))
    .map(user => {
      const message = `Hey there **${user.name}**,  \nUser @${
        params.chat.user
      } mentioned you in Guild chat at [${
        params.group.name
      }](https://habitica.com/groups/guild/${params.group.id})

\`This notification was brought to you by NotificaBot\``;
      return sendMessage(message, user.id)
        .then(() => console.log(`notified ${user.name}`))
        .catch(err => console.error(err));
    });

  await Promise.all(promises);

  return {
    statusCode: 200,
    body: "OK"
  };
};

async function sendMessage(message, userId) {
  try {
    const url = process.env.API_BASE_URL + "/members/send-private-message";
    const options = {
      method: "POST",
      body: JSON.stringify({ message, toUserId: userId }),
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
