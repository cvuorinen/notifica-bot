# notifica-bot

Habitica bot for handling chat notifications.

Runs as a serverless lambda function on [Netlify](https://www.netlify.com/docs/functions/).

Features:

- Webhook (`type: groupChatReceived`) needs to be set up separately (not handled ny this bot)
- Handles subscriptions by mention `@NotificaBot` in chat
  - `@NotificaBot subscribe` to subscribe
  - `@NotificaBot unsubscribe` to unsubscribe
- Bot sends user a private message when @username mentioned in a chat message
  - So user needs to have push notifications on for private messages to get push notifications for mentions
