# Support Chat Demo

*Important Note: This is a proof of concept with only the essential features it should have (chat, presence, history). It’s intentionally simplified as much as possible to be a basic example of how you could build your own support chat while we build a more extensive version that can more reasonably be expanded on and reused. You should be careful resuing this code as it is in your application: it's not following all best practices. The ultimate goal is to create a series of chat components that can be reused to create a more consistent development experience and simplify the process for making more future demos. In the coming weeks we’ll be rebuilding this app completely. Stay tuned for more.

This project demonstrates how you could build a support chat (including dashboard and client view) using PubNub. 

[Try this demo](https://www.pubnub.com/developers/demos/support-chat/) without installing anything.

Learn more infomation about the [Support Chat UI Kit](https://www.pubnub.com/chat-ui-kit/) from the [PubNub UI Kit](https://www.pubnub.com/chat-ui-kit/) page.

<a href="https://www.pubnub.com/developers/demos/support-chat/">
    <img alt="Support Chat Demo" src="https://raw.githubusercontent.com/PubNubDevelopers/support-chat-demo/master/screencapture-pubnub-developers-demos-support-chat.png" width=800/>
</a>

## Features:

- 1 to 1 style chat with automatic creation of new chats.
- [PubNub Presence](https://www.pubnub.com/products/presence/) powered chat selection.
- Emoji selector.
- [Channel Wildcards](https://www.pubnub.com/docs/platform/channels/channel-management).
- Message history.

### Coming soon:
- Typing indicators
- Read receipts
- Dark theme.

## Requirements

- [Node.js](https://nodejs.org/en/)
- [PubNub Account](#pubnub-account) (*Free*) 

<a href="https://dashboard.pubnub.com/signup">
    <img alt="PubNub Signup" src="https://i.imgur.com/og5DDjf.png" width=260 height=97/>
</a>

## PubNub Account

1. You’ll first need to sign up for a [PubNub account](https://dashboard.pubnub.com/signup/). Once you sign up, you can get your unique PubNub keys from the [PubNub Developer Portal](https://admin.pubnub.com/).

1. Sign in to your [PubNub Dashboard](https://dashboard.pubnub.com/).

1. Click **Create New App**.

1. Give your app a name, and select **Chat App** as the app type.

1. Click **Create**.

1. Click your new app to open its settings, then click its keyset.

1. [Enable the channel presence feature](https://support.pubnub.com/support/solutions/articles/14000043562-how-do-i-enable-the-channel-presence-feature-/) for your keyset.

## Building and Running

- Keep in mind that this demo is a work in progress. Some features may not be available in this demo yet and you should always review the code before including it into your application. 

1. You'll need to run the following commands from your terminal for both of the application views (dashboard and client).

1. Clone the GitHub repository.

    ```bash
    git clone https://github.com/PubNubDevelopers/support-chat-demo.git
    ```

1. CD into the the dashboard or client views:

    ```bash
    cd dashboard
    ```

    OR

    ```bash
    cd client
    ```

1. Open src/App.tsx. Replace the Publish and Subscribe keys with your keyset from your [PubNub Dashboard](https://dashboard.pubnub.com/).

1. Install the project.

    ```bash
    npm install
    ```

1. Run the project in your local environment.

    ```bash
    npm start
    ```

    A web browser should automatically open for each view and you can explore your very own Support Chat app! Click "Start Conversation" in the client view to create a new conversation between the dashboard view and client.


## Further Information

Checkout [PubNub Chat Docs](https://www.pubnub.com/docs/chat) page for more information about how to use the React and Redux SDKs to add in-app chat to your applications.
