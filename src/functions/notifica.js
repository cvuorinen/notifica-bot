import fetch from "node-fetch";

const botName = "NotificaBot";

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const params = JSON.parse(event.body);
    //console.log(params);

    /**
     * Format of the incoming params:
     * {
     *    group: {
     *      id: 'uuid-of-the-guild',
     *      name: 'Guild Name'
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

    if (!params.chat.text.includes("@")) {
      // nothing to do since no @mentions in message
      return { statusCode: 200, body: "OK" };
    }

    const { subscriptions } = await getSubscriptions();

    if (!subscriptions || !Array.isArray(subscriptions)) {
      return { statusCode: 500, body: "Server Error" };
    }

    if (params.chat.text.includes(`@${botName} subscribe`)) {
      if (subscriptions.find(sub => sub.id === params.chat.uuid)) {
        console.log(`already subscribed [uuid:${params.chat.uuid}]`); // TODO response?
      } else {
        subscriptions.push({
          id: params.chat.uuid,
          name: params.chat.username,
          displayName:
            params.chat.user !== params.chat.username
              ? params.chat.user
              : undefined
        });
        await saveSubscriptions(subscriptions);

        const message = `Hello **${
          params.chat.username
        }**,  \nYou have now been subscribed to Guild chat notifications by me, @${botName}, so I will send you a private message everytime someone mentions your @username in Guild chat. How nice is that? Looking forward to sending you more messages.

To unsubscribe, you can send a message in the Guild chat with text: \`@${botName} unsubscribe\``;

        await sendMessage(message, params.chat.uuid);
      }
    }

    if (params.chat.text.includes(`@${botName} unsubscribe`)) {
      if (subscriptions.find(sub => sub.id === params.chat.uuid)) {
        await saveSubscriptions(
          subscriptions.filter(sub => sub.id !== params.chat.uuid)
        );

        const message = `Hi **${
          params.chat.username
        }**,  \nYou have been unsubscribed from @${botName} notifications and will not receive any further communication from me. It was nice knowing you.`;

        await sendMessage(message, params.chat.uuid);
      } else {
        console.log(`subscription not found [uuid:${params.chat.uuid}]`); // TODO response?
      }
    }

    const promises = subscriptions
      .filter(
        user =>
          params.chat.text.includes(`@${user.name}`) ||
          (user.displayName &&
            params.chat.text.includes(`@${user.displayName}`))
      )
      .map(user => {
        const message = `Hey there **${user.name}**,  \nUser @${
          params.chat.user
        } mentioned you in Guild chat at [${
          params.group.name
        }](https://habitica.com/groups/guild/${params.group.id})

\`This notification was brought to you by ${botName}\``;
        return sendMessage(message, user.id)
          .then(() => console.log(`notified ${user.name}`))
          .catch(err => console.error(err));
      });

    await Promise.all(promises);
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: 200,
    body: "OK"
  };
};

async function getSubscriptions() {
  const url = process.env.JSONBIN_URL + "/latest";
  const options = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "secret-key": process.env.JSONBIN_KEY
    }
  };

  return fetchJson(url, options);
}

async function saveSubscriptions(subscriptions) {
  const url = process.env.JSONBIN_URL;
  const options = {
    method: "PUT",
    body: JSON.stringify({ subscriptions }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "secret-key": process.env.JSONBIN_KEY
    }
  };

  return fetchJson(url, options);
}

async function sendMessage(message, userId) {
  const url = process.env.API_BASE_URL + "/members/send-private-message";
  const options = {
    method: "POST",
    body: JSON.stringify({ message, toUserId: userId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // X-Client header as per instructions here: https://habitica.fandom.com/wiki/Guidance_for_Comrades#X-Client_Header
      "x-client": "fa756acf-9127-4a3c-8dac-8ff627d30073-NotificaBot",
      "x-api-user": process.env.USER_ID,
      "x-api-key": process.env.API_KEY
    }
  };

  return fetchJson(url, options);
}

async function fetchJson(url, options) {
  //console.log("fetch", { url, options });
  const response = await fetch(url, options);

  if (!response.ok) {
    throw Error(
      `${response.status} ${response.statusText} "${await response.text()}"`
    );
  }

  return response.json();
}
