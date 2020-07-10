import React, { useCallback, useEffect, useState, useRef } from 'react';
import PubNub from 'pubnub';
import { PubNubProvider, usePubNub } from 'pubnub-react';
import styled from "styled-components";
import './App.css';
import 'emoji-mart/css/emoji-mart.css';
import { Picker } from 'emoji-mart';
 
const pubnub = new PubNub({
  publishKey: 'pub-c-a4c4e92e-a605-4508-89f7-c37faf290e88',
  subscribeKey: 'sub-c-3035268e-a0fe-11ea-8e2f-c62edd1c297d',
  uuid: 'agent'
});
const supportChannel = 'supportChannel.';

const SupportDashboard = () => {
  const pubnub = usePubNub();
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [input, setInput] = useState('');
  const [activeChatChannel, setActiveChatChannel] = useState('');
  const [activeChatName, setActiveChatName] = useState('');
  const [activeChatTotal, setActiveChatTotal] = useState(0);
  const [emojiShow, toggleEmojiShow] = React.useState(false);
  const divRef = useRef(null);
  const divRefActive = useRef(null);
  const messageRef = useRef([]);
  const activeChatNameRef = useRef('');
  messageRef.current = messages;
  activeChatNameRef.current = activeChatName;
 
  const sendMessage = useCallback(
    async message => {
      console.log(activeChatChannel);
      if (input && activeChatChannel !== "") {
        await pubnub.publish({
                message: {sender:"agent",name:'agent',message:input.replace(/<[^>]*>?/gm, '')},
                channel:activeChatChannel
              });
        setInput('');
        setMessages([...messageRef.current, {sender:"agent",name:'agent',message:input.replace(/<[^>]*>?/gm, '')}] as any);
        if (document.getElementById("activeUserLast-"+activeChatName)) {
          document.getElementById("activeUserLast-"+activeChatName).innerHTML = input.substring(0,40);
        }
        divRef.current.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert("Start a new conversation from the customer view before sending messages.")
        setInput('');
      }
    },
    [pubnub, setInput, input, activeChatChannel, activeChatName]
  );

  function openChat(clientName) {
    if (activeChatName !== clientName) {
      setActiveChatChannel(supportChannel+clientName.replace(/\s/g, ''));
      setActiveChatName(clientName);
      setMessages([]);
      let channelHistory = [];
      pubnub.history(
        {
            channel: supportChannel+clientName.replace(/\s/g, ''),
            count: 10
        },
        (status, response) => {
          if (response) {
            if (response.messages && response.messages.length > 0) {
              for (var i = 0; i <= response.messages.length-1; i++) {
                channelHistory.push(response.messages[i].entry);
              } 
              setTimeout(() => {  updateActiveChats(); }, 500);
            }
          }
          setMessages(channelHistory);
          divRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      );
    }
  }

  function accountFromUUID(uuid) { // Makes a fake account string for user
    return (uuid.charAt(0).toUpperCase()+uuid.charAt(5).toUpperCase()+uuid.charAt(9).toUpperCase()+uuid.charAt(0).toUpperCase())
  }

  function lastMessagePreview(uuid) {
    pubnub.history(
      {
          channel: supportChannel+uuid.replace(/\s/g, ''),
          count: 1
      },
      (status, response) => {
        if (response) {
          if (response.messages && response.messages.length > 0) {
            if (document.getElementById("activeUserLast-"+uuid)) {
              document.getElementById("activeUserLast-"+uuid).innerHTML = response.messages[0].entry.message.substring(0,40);
            }
          } 
        }
      }
    );
  }

  function updateActiveChats(){
    let newActiveUsers = [];
    pubnub.hereNow(
      {
        channels: [supportChannel+"*"],
        includeUUIDs: true,
      },
      (status, response) => {
        if (response.channels["supportChannel.*"].occupancy > 0) {
          for (var i = response.channels["supportChannel.*"].occupancy-1; i >= 0 ; i--) {
            if (response.channels["supportChannel.*"].occupants[i].uuid !== "agent") {
              let user = response.channels["supportChannel.*"].occupants[i];
              lastMessagePreview(user.uuid);
              newActiveUsers.push({uuid:user.uuid, account: accountFromUUID(user.uuid.replace(/\s/g, '')), initial: user.uuid.charAt(0).toUpperCase()});
            }
          }
        }
        if (response.channels["supportChannel.*"].occupancy-1 >= 0) {
          setActiveChatTotal([response.channels["supportChannel.*"].occupancy-1] as any);
        } else {
          setActiveChatTotal([0] as any);
        }
      }
    )
    if (activeUsers !== newActiveUsers) {
      setActiveUsers(newActiveUsers);
    }
    divRefActive.current.scrollIntoView({ behavior: 'smooth' });
  };

  function startPubNub() {
    pubnub.addListener({
      status: function(statusEvent) {
        if (statusEvent.category === "PNConnectedCategory") {
          updateActiveChats();
        }
      },
      message: messageEvent => {
        if (messageEvent.message.name === activeChatNameRef.current) {
          setMessages([...messageRef.current, messageEvent.message] as any);
          divRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (document.getElementById("activeUserLast-"+messageEvent.message.name)) {
          document.getElementById("activeUserLast-"+messageEvent.message.name).innerHTML = messageEvent.message.message.substring(0,40);
        }

      },
      presence: function(presenceEvent) {
        if ((presenceEvent.action === "join") || (presenceEvent.action === "leave")) {
          updateActiveChats();
        }
      },
    });
    pubnub.subscribe({
        channels: [supportChannel+"*"],
        withPresence: true
    });
  };
  useEffect(startPubNub, []);

  useEffect(() => {
    const listener = event => {
      if (event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault();
        sendMessage(input);
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [input, sendMessage]);

  return (
    <Container>
      <LeftMenuRow>
        <LeftMenu>
          <LeftBgStack>
            <LeftBg>
              <Menu>
                <PubNubLogo>
                  <PathRow>
                    <svg
                      viewBox="0 0 6 9"
                      style={{
                        height: 9,
                        width: 6,
                        backgroundColor: "transparent",
                        borderColor: "transparent"
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(239,66,62,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M0.00 0.00 C0.00 0.00 2.14 -0.00 3.15 0.00 C3.62 -0.00 4.10 0.06 4.56 0.20 C5.38 0.46 5.87 1.06 5.97 1.93 C6.02 2.38 6.01 2.83 5.92 3.28 C5.75 4.07 5.26 4.57 4.51 4.83 C4.09 4.97 3.65 5.04 3.21 5.03 C2.64 5.04 1.50 5.03 1.50 5.03 L1.37 5.03 L1.37 9.00 L0.00 9.00 Z M1.37 4.04 C1.37 4.04 1.41 4.04 1.43 4.04 C1.95 4.04 2.48 4.05 3.00 4.04 C3.23 4.03 3.44 4.00 3.66 3.95 C4.11 3.85 4.43 3.61 4.55 3.14 C4.65 2.77 4.67 2.37 4.59 1.99 C4.51 1.53 4.25 1.22 3.80 1.12 C3.53 1.05 3.25 1.01 2.97 1.00 C2.47 0.98 1.98 0.99 1.48 0.99 C1.44 0.99 1.37 1.00 1.37 1.00 L1.37 4.04 Z"
                      ></path>
                    </svg>
                    <svg
                      viewBox="0 0 6 7"
                      style={{
                        height: 7,
                        width: 6,
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        marginLeft: 1,
                        marginTop: 2
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(239,66,62,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M2.53 7.00 C2.37 6.98 2.20 6.96 2.03 6.93 C1.63 6.88 1.25 6.75 0.90 6.54 C0.36 6.21 0.08 5.71 0.02 5.09 C0.00 4.91 0.00 4.73 0.00 4.55 C0.00 3.08 0.00 1.61 0.00 0.13 L0.00 0.00 L1.38 0.00 L1.38 0.14 C1.38 1.46 1.38 2.78 1.38 4.11 C1.37 4.43 1.41 4.76 1.50 5.08 C1.66 5.60 2.03 5.90 2.56 5.97 C3.21 6.04 3.87 5.98 4.50 5.79 C4.54 5.79 4.57 5.77 4.59 5.74 C4.62 5.71 4.62 5.67 4.62 5.63 C4.62 3.80 4.62 1.97 4.62 0.14 L4.62 0.00 L6.00 0.00 L6.00 0.14 C6.00 2.22 6.00 4.30 6.00 6.38 C6.00 6.42 6.00 6.47 5.97 6.50 C5.95 6.53 5.91 6.55 5.87 6.56 C5.06 6.78 4.24 6.92 3.41 6.98 C3.38 6.99 3.35 6.99 3.33 7.00 Z"
                      ></path>
                    </svg>
                    <svg
                      viewBox="0 0 6 9"
                      style={{
                        height: 9,
                        width: 6,
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        marginLeft: 1
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(239,66,62,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M2.50 9.00 L2.11 8.96 C2.11 8.96 0.76 8.74 0.12 8.52 C0.04 8.50 -0.01 8.43 0.00 8.35 C0.00 5.61 0.00 0.12 0.00 0.12 L0.00 0.00 L1.30 0.00 L1.30 2.83 L1.50 2.76 C1.50 2.76 2.81 2.42 3.48 2.44 C4.56 2.49 5.36 3.05 5.75 4.03 C5.91 4.48 6.00 4.95 6.00 5.43 C6.02 6.01 5.95 6.59 5.80 7.15 C5.52 8.15 4.84 8.73 3.80 8.92 C3.64 8.95 3.48 8.96 3.32 8.98 C3.30 8.99 3.25 9.00 3.25 9.00 Z M1.31 5.72 C1.31 5.72 1.31 7.02 1.31 7.67 C1.30 7.74 1.34 7.80 1.41 7.81 C1.80 7.95 2.21 8.04 2.62 8.07 C2.92 8.10 3.21 8.08 3.50 8.01 C4.05 7.88 4.37 7.51 4.52 7.00 C4.73 6.25 4.76 5.47 4.62 4.71 C4.58 4.39 4.44 4.09 4.23 3.85 C3.90 3.48 3.47 3.36 2.99 3.35 C2.45 3.35 1.91 3.44 1.40 3.64 C1.34 3.65 1.30 3.71 1.31 3.78 C1.31 4.42 1.31 5.72 1.31 5.72 L1.31 5.72 Z"
                      ></path>
                    </svg>
                    <svg
                      viewBox="0 0 7 9"
                      style={{
                        height: 9,
                        width: 7,
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        marginLeft: 1
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(239,66,62,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M7.00 9.00 L5.79 9.00 C5.56 9.00 5.34 9.00 5.11 9.00 C5.04 9.01 4.98 8.97 4.96 8.90 C4.43 7.83 3.90 6.75 3.37 5.67 L1.20 1.26 C1.18 1.23 1.16 1.20 1.13 1.19 L1.13 8.99 L0.00 8.99 L0.00 0.01 C0.03 0.01 0.06 0.00 0.09 0.00 C0.69 0.00 1.28 0.00 1.87 0.00 C1.93 -0.01 1.99 0.03 2.01 0.09 C3.27 2.65 4.53 5.21 5.79 7.77 C5.81 7.80 5.83 7.83 5.86 7.85 L5.86 0.01 L7.00 0.01 L7.00 9.00 Z"
                      ></path>
                    </svg>
                    <svg
                      viewBox="0 0 6 7"
                      style={{
                        height: 7,
                        width: 6,
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        marginLeft: 1,
                        marginTop: 2
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(239,66,62,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M2.54 7.00 C2.37 6.98 2.20 6.96 2.03 6.93 C1.64 6.88 1.26 6.75 0.92 6.55 C0.37 6.22 0.09 5.73 0.02 5.10 C0.01 4.93 -0.00 4.77 0.00 4.60 C0.00 3.11 0.00 1.62 0.00 0.13 L0.00 0.00 L1.38 0.00 L1.38 0.14 C1.38 1.48 1.38 2.83 1.38 4.18 C1.38 4.49 1.42 4.81 1.52 5.11 C1.68 5.62 2.05 5.90 2.57 5.97 C3.21 6.03 3.85 5.98 4.47 5.80 C4.52 5.80 4.56 5.77 4.59 5.73 C4.62 5.70 4.63 5.65 4.62 5.60 C4.62 3.78 4.62 1.96 4.62 0.14 L4.62 0.00 L5.99 0.00 C5.99 0.04 6.00 0.08 6.00 0.11 C6.00 2.21 6.00 4.31 6.00 6.40 C6.00 6.44 6.00 6.47 5.98 6.50 C5.96 6.53 5.92 6.54 5.89 6.55 C5.08 6.77 4.26 6.92 3.42 6.98 C3.39 6.98 3.36 6.99 3.33 7.00 L2.54 7.00 Z"
                      ></path>
                    </svg>
                    <svg
                      viewBox="0 0 6 9"
                      style={{
                        height: 9,
                        width: 6,
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        marginLeft: 1
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(239,66,62,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M2.50 9.00 L2.11 8.96 C2.11 8.96 0.76 8.75 0.12 8.52 C0.04 8.50 -0.01 8.43 0.00 8.35 C0.00 5.61 0.00 0.11 0.00 0.11 L0.00 0.00 L1.30 0.00 L1.30 2.82 C1.30 2.82 1.46 2.77 1.54 2.74 C2.15 2.52 2.81 2.41 3.48 2.44 C4.58 2.49 5.38 3.06 5.76 4.07 C5.97 4.62 6.01 5.20 6.00 5.78 C5.99 6.29 5.91 6.80 5.76 7.29 C5.46 8.18 4.82 8.70 3.90 8.90 C3.71 8.94 3.51 8.95 3.31 8.98 C3.28 8.99 3.23 9.00 3.23 9.00 L2.50 9.00 Z M1.31 5.72 C1.31 5.72 1.31 7.03 1.31 7.69 C1.31 7.74 1.32 7.78 1.38 7.80 C1.93 8.01 2.53 8.10 3.12 8.07 C3.47 8.05 3.79 7.96 4.07 7.73 C4.32 7.52 4.46 7.24 4.54 6.93 C4.73 6.22 4.76 5.48 4.64 4.76 C4.60 4.44 4.47 4.14 4.27 3.89 C3.94 3.50 3.49 3.36 3.00 3.35 C2.45 3.35 1.91 3.44 1.40 3.64 C1.34 3.65 1.30 3.71 1.31 3.77 C1.31 4.42 1.31 5.72 1.31 5.72 Z"
                      ></path>
                    </svg>
                  </PathRow>
                </PubNubLogo>
                <MenuTarget>
                  <Rectangle8>
                    <IconTarget>
                      <FillStack>
                        <svg
                          viewBox="0 0 14 14"
                          style={{
                            position: "absolute",
                            height: 14,
                            width: 14,
                            top: 0,
                            left: 0,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M11.55 11.71 C11.69 11.60 11.82 11.48 11.95 11.35 C13.27 10.10 14.00 8.43 14.00 6.65 C14.00 5.61 13.76 4.62 13.27 3.69 C13.18 3.52 12.96 3.45 12.78 3.54 C12.60 3.62 12.52 3.83 12.61 4.01 C13.04 4.83 13.26 5.72 13.26 6.65 C13.26 9.93 10.45 12.60 7.00 12.60 C3.55 12.60 0.74 9.93 0.74 6.65 C0.74 3.37 3.55 0.70 7.00 0.70 C7.98 0.70 8.91 0.91 9.78 1.32 C9.97 1.40 10.19 1.33 10.28 1.16 C10.37 0.99 10.29 0.78 10.11 0.69 C9.14 0.23 8.09 0.00 7.00 0.00 C5.13 0.00 3.37 0.69 2.05 1.95 C0.73 3.20 0.00 4.87 0.00 6.65 C0.00 8.43 0.73 10.10 2.05 11.35 C2.18 11.48 2.31 11.59 2.45 11.71 L1.51 13.49 C1.42 13.67 1.50 13.88 1.68 13.96 C1.73 13.99 1.79 14.00 1.84 14.00 C1.98 14.00 2.11 13.93 2.17 13.81 L3.05 12.14 C4.20 12.89 5.57 13.30 7.00 13.30 C8.43 13.30 9.80 12.89 10.95 12.14 L11.83 13.81 C11.89 13.93 12.02 14.00 12.16 14.00 C12.21 14.00 12.27 13.99 12.32 13.96 C12.51 13.88 12.58 13.67 12.49 13.49 L11.55 11.71 L11.55 11.71 Z"
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 7.78 7.78"
                          style={{
                            position: "absolute",
                            height: 8,
                            width: 8,
                            top: 3,
                            left: 3,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M3.89 7.78 C1.74 7.78 0.00 6.03 0.00 3.89 C0.00 1.74 1.74 0.00 3.89 0.00 C4.43 0.00 4.95 0.11 5.44 0.32 C5.62 0.40 5.71 0.61 5.63 0.79 C5.55 0.97 5.34 1.05 5.16 0.97 C4.76 0.80 4.33 0.71 3.89 0.71 C2.13 0.71 0.71 2.14 0.71 3.89 C0.71 5.64 2.13 7.07 3.89 7.07 C5.64 7.07 7.07 5.64 7.07 3.89 C7.07 3.33 6.92 2.78 6.65 2.30 C6.55 2.13 6.61 1.91 6.77 1.82 C6.94 1.72 7.16 1.77 7.26 1.94 C7.60 2.53 7.78 3.21 7.78 3.89 C7.78 6.03 6.03 7.78 3.89 7.78 Z"
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 6.22 5.44"
                          style={{
                            position: "absolute",
                            height: 5,
                            width: 6,
                            top: 2,
                            left: 6,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M5.83 1.36 L4.67 1.36 L4.67 0.34 C4.67 0.15 4.49 0.00 4.28 0.00 C4.06 0.00 3.89 0.15 3.89 0.34 L3.89 1.54 C3.36 1.94 1.45 3.40 0.09 4.89 C-0.05 5.04 -0.02 5.25 0.15 5.37 C0.22 5.42 0.30 5.44 0.39 5.44 C0.50 5.44 0.62 5.40 0.69 5.32 C2.02 3.87 3.95 2.39 4.42 2.04 L5.83 2.04 C6.05 2.04 6.22 1.89 6.22 1.70 C6.22 1.51 6.05 1.36 5.83 1.36 L5.83 1.36 Z"
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 2.33 2.33"
                          style={{
                            position: "absolute",
                            height: 2,
                            width: 2,
                            top: 0,
                            left: 12,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M1.94 2.33 L0.39 2.33 C0.17 2.33 0.00 2.16 0.00 1.94 L0.00 0.39 C0.00 0.17 0.17 0.00 0.39 0.00 C0.60 0.00 0.78 0.17 0.78 0.39 L0.78 1.56 L1.94 1.56 C2.16 1.56 2.33 1.73 2.33 1.94 C2.33 2.16 2.16 2.33 1.94 2.33 "
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 3.89 3.11"
                          style={{
                            position: "absolute",
                            height: 3,
                            width: 4,
                            top: 5,
                            left: 5,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M1.94 3.11 C0.87 3.11 0.00 2.40 0.00 1.54 C0.00 0.82 0.60 0.19 1.46 0.01 C1.67 -0.03 1.88 0.07 1.93 0.24 C1.99 0.41 1.86 0.58 1.65 0.62 C1.14 0.73 0.78 1.10 0.78 1.54 C0.78 2.06 1.30 2.48 1.94 2.48 C2.59 2.48 3.11 2.06 3.11 1.54 C3.11 1.36 3.29 1.22 3.50 1.22 C3.71 1.22 3.89 1.36 3.89 1.54 C3.89 2.40 3.02 3.11 1.94 3.11 L1.94 3.11 Z"
                          ></path>
                        </svg>
                      </FillStack>
                    </IconTarget>
                  </Rectangle8>
                </MenuTarget>
                <MenuGroup>
                  <MenuGroupArea>
                    <IconGroup>
                      <MenuGroupStack>
                        <MenugGroupPathStack>
                          <svg
                            viewBox="0 0 10.83 5"
                            style={{
                              position: "absolute",
                              height: 5,
                              width: 11,
                              top: 4,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(136,136,136,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M1.35 2.31 C2.10 1.34 3.51 0.83 5.42 0.83 C7.33 0.83 8.73 1.34 9.49 2.31 C10.03 3.01 10.06 3.72 10.06 3.75 C10.06 3.98 9.67 4.17 9.67 4.17 L1.16 4.17 C1.16 4.17 0.77 3.98 0.77 3.75 M10.83 3.75 C10.83 3.71 10.83 2.76 10.12 1.82 C9.71 1.28 9.16 0.86 8.47 0.55 C7.64 0.19 6.61 0.00 5.42 0.00 C4.22 0.00 3.19 0.18 2.36 0.55 C1.68 0.86 1.12 1.28 0.71 1.82 C0.01 2.76 0.00 3.71 0.00 3.75 C0.00 4.44 1.16 5.00 1.16 5.00 L9.67 5.00 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 4.17 5"
                            style={{
                              position: "absolute",
                              height: 5,
                              width: 4,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(136,136,136,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M3.47 2.50 C3.47 3.42 2.85 4.17 2.08 4.17 C1.32 4.17 0.69 3.42 0.69 2.50 C0.69 1.58 1.32 0.83 2.08 0.83 M4.17 2.50 C4.17 1.12 3.23 0.00 2.08 0.00 C0.93 0.00 0.00 1.12 0.00 2.50 C0.00 3.88 0.93 5.00 2.08 5.00 "
                            ></path>
                          </svg>
                        </MenugGroupPathStack>
                        <svg
                          viewBox="0 0 5.83 5.83"
                          style={{
                            position: "absolute",
                            height: 6,
                            width: 6,
                            top: 0,
                            left: 7,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M5.10 2.92 C5.10 4.12 4.12 5.10 2.92 5.10 C1.71 5.10 0.73 4.12 0.73 2.92 C0.73 1.71 1.71 0.73 2.92 0.73 M5.83 2.92 C5.83 1.31 4.53 0.00 2.92 0.00 C1.31 0.00 0.00 1.31 0.00 2.92 C0.00 4.53 1.31 5.83 2.92 5.83 "
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 4.17 4.17"
                          style={{
                            position: "absolute",
                            height: 4,
                            width: 4,
                            top: 8,
                            left: 0,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M3.12 4.17 L1.04 4.17 C0.47 4.17 0.00 3.61 0.00 2.92 C0.00 2.89 0.01 2.14 0.46 1.42 C0.72 1.00 1.08 0.66 1.52 0.43 C2.06 0.14 2.71 0.00 3.47 0.00 C3.60 0.00 3.72 0.00 3.84 0.01 C4.03 0.02 4.18 0.22 4.17 0.45 C4.16 0.68 3.99 0.86 3.80 0.84 C3.69 0.84 3.58 0.83 3.47 0.83 C0.77 0.83 0.70 2.82 0.70 2.92 C0.70 3.15 0.85 3.33 1.04 3.33 L3.13 3.33 C3.32 3.33 3.47 3.52 3.47 3.75 C3.47 3.98 3.32 4.17 3.13 4.17 L3.12 4.17 Z"
                          ></path>
                        </svg>
                      </MenuGroupStack>
                    </IconGroup>
                  </MenuGroupArea>
                </MenuGroup>
                <SelectedMessages>
                  <SelectedMessagesGroup>
                    <IconMesssages>
                      <PathSelectedStack>
                        <svg
                          viewBox="0 0 16 14.32"
                          style={{
                            position: "absolute",
                            height: 14,
                            width: 16,
                            top: 0,
                            left: 0,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(255,255,255,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M15.16 6.32 C15.16 9.33 11.95 11.79 8.00 11.79 C7.14 11.79 6.30 11.67 5.50 11.45 C5.38 11.41 5.25 11.43 5.15 11.50 C4.27 12.10 3.09 12.77 2.00 13.15 C2.89 12.18 3.23 11.17 3.33 10.81 C3.37 10.63 3.31 10.45 3.16 10.35 C1.69 9.32 0.84 7.85 0.84 6.32 C0.84 3.30 4.05 0.84 8.00 0.84 C11.95 0.84 15.16 3.30 15.16 6.32 Z M0.42 14.32 C0.42 14.32 2.36 14.00 3.62 13.38 C4.42 12.98 5.10 12.55 5.46 12.31 C6.28 12.52 7.13 12.63 8.00 12.63 C10.12 12.63 12.11 11.99 13.62 10.82 C14.36 10.24 14.94 9.57 15.35 8.81 C15.78 8.02 16.00 7.18 16.00 6.32 C16.00 5.45 15.78 4.61 15.35 3.82 C14.94 3.07 14.36 2.39 13.62 1.82 C12.11 0.65 10.12 0.00 8.00 0.00 C5.88 0.00 3.89 0.65 2.38 1.82 C1.64 2.39 1.06 3.07 0.65 3.82 C0.22 4.61 0.00 5.45 0.00 6.32 C0.00 8.03 0.88 9.67 2.43 10.86 C2.22 11.44 1.63 12.68 0.20 13.53 C0.04 13.63 -0.04 13.82 0.02 14.01 C0.07 14.19 0.42 14.32 0.42 14.32 L0.42 14.32 Z"
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 2.53 2.53"
                          style={{
                            position: "absolute",
                            height: 3,
                            width: 3,
                            top: 5,
                            left: 7,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(255,255,255,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M1.68 1.26 C1.68 1.50 1.50 1.68 1.26 1.68 C1.03 1.68 0.84 1.50 0.84 1.26 C0.84 1.03 1.03 0.84 1.26 0.84 M2.53 1.26 C2.53 0.57 1.96 0.00 1.26 0.00 C0.57 0.00 0.00 0.57 0.00 1.26 C0.00 1.96 0.57 2.53 1.26 2.53 "
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 2.53 2.53"
                          style={{
                            position: "absolute",
                            height: 3,
                            width: 3,
                            top: 5,
                            left: 10,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(255,255,255,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M1.68 1.26 C1.68 1.50 1.50 1.68 1.26 1.68 C1.03 1.68 0.84 1.50 0.84 1.26 C0.84 1.03 1.03 0.84 1.26 0.84 M2.53 1.26 C2.53 0.57 1.96 0.00 1.26 0.00 C0.57 0.00 0.00 0.57 0.00 1.26 C0.00 1.96 0.57 2.53 1.26 2.53 "
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 2.53 2.53"
                          style={{
                            position: "absolute",
                            height: 3,
                            width: 3,
                            top: 5,
                            left: 3,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(255,255,255,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M1.68 1.26 C1.68 1.50 1.50 1.68 1.26 1.68 C1.03 1.68 0.84 1.50 0.84 1.26 C0.84 1.03 1.03 0.84 1.26 0.84 M2.53 1.26 C2.53 0.57 1.96 0.00 1.26 0.00 C0.57 0.00 0.00 0.57 0.00 1.26 C0.00 1.96 0.57 2.53 1.26 2.53 "
                          ></path>
                        </svg>
                      </PathSelectedStack>
                    </IconMesssages>
                  </SelectedMessagesGroup>
                </SelectedMessages>
                <MenuCalendar>
                  <Rectangle5>
                    <IconCalendar>
                      <Path16Stack>
                        <svg
                          viewBox="0 0 14 12.44"
                          style={{
                            position: "absolute",
                            height: 12,
                            width: 14,
                            top: 0,
                            left: 0,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M12.95 11.75 L1.05 11.75 L0.70 11.41 L0.70 4.15 L13.30 4.15 L13.30 11.41 M1.05 1.38 L2.80 1.38 L2.80 2.42 C2.80 2.42 2.96 2.77 3.15 2.77 C3.34 2.77 3.50 2.42 3.50 2.42 L3.50 1.38 L10.50 1.38 L10.50 2.42 C10.50 2.42 10.66 2.77 10.85 2.77 C11.04 2.77 11.20 2.42 11.20 2.42 L11.20 1.38 L12.95 1.38 L13.30 1.73 L13.30 3.46 L0.70 3.46 L0.70 1.73 M12.95 0.69 L11.20 0.69 L11.20 0.35 C11.20 0.35 11.04 0.00 10.85 0.00 C10.66 0.00 10.50 0.35 10.50 0.35 L10.50 0.69 L3.50 0.69 L3.50 0.35 C3.50 0.35 3.34 0.00 3.15 0.00 C2.96 0.00 2.80 0.35 2.80 0.35 L2.80 0.69 L1.05 0.69 L0.00 1.73 L0.00 11.41 L1.05 12.44 L12.95 12.44 L14.00 11.41 L14.00 1.73 "
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 3.11 4.67"
                          style={{
                            position: "absolute",
                            height: 5,
                            width: 3,
                            top: 5,
                            left: 4,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M2.72 4.67 L0.39 4.67 C0.17 4.67 0.00 4.52 0.00 4.33 C0.00 4.15 0.17 4.00 0.39 4.00 L2.33 4.00 L2.33 2.67 L1.17 2.67 C0.95 2.67 0.78 2.52 0.78 2.33 C0.78 2.15 0.95 2.00 1.17 2.00 L2.33 2.00 L2.33 0.67 L0.39 0.67 C0.17 0.67 0.00 0.52 0.00 0.33 C0.00 0.15 0.17 0.00 0.39 0.00 L2.72 0.00 C2.94 0.00 3.11 0.15 3.11 0.33 L3.11 4.33 C3.11 4.52 2.94 4.67 2.72 4.67 "
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 0.78 4.67"
                          style={{
                            position: "absolute",
                            height: 5,
                            width: 1,
                            top: 5,
                            left: 9,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M0.39 4.67 C0.17 4.67 0.00 4.52 0.00 4.33 L0.00 0.33 C0.00 0.15 0.17 0.00 0.39 0.00 C0.60 0.00 0.78 0.15 0.78 0.33 L0.78 4.33 C0.78 4.52 0.60 4.67 0.39 4.67 "
                          ></path>
                        </svg>
                      </Path16Stack>
                    </IconCalendar>
                  </Rectangle5>
                </MenuCalendar>
                <MenuTickets>
                  <Rectangle4>
                    <IconTickets>
                      <Fill11Stack>
                        <svg
                          viewBox="0 0 0.79 0.79"
                          style={{
                            position: "absolute",
                            height: 1,
                            width: 1,
                            top: 2,
                            left: 5,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M0.39 0.79 C0.29 0.79 0.19 0.74 0.12 0.67 C0.04 0.60 0.00 0.50 0.00 0.39 C0.00 0.29 0.04 0.19 0.12 0.12 C0.19 0.04 0.29 0.00 0.39 0.00 C0.50 0.00 0.60 0.04 0.67 0.12 C0.74 0.19 0.79 0.29 0.79 0.39 C0.79 0.50 0.74 0.60 0.67 0.67 C0.60 0.74 0.50 0.79 0.39 0.79 "
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 11 14.14"
                          style={{
                            position: "absolute",
                            height: 14,
                            width: 11,
                            top: 0,
                            left: 0,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M10.27 13.08 L9.90 13.44 L4.03 13.44 L3.67 13.08 L3.67 7.78 L4.77 7.78 L5.87 6.72 L5.87 5.66 L9.90 5.66 L10.27 6.01 Z M5.13 5.80 L5.13 6.72 L4.77 7.07 L3.82 7.07 L5.13 5.80 Z M1.10 11.31 L0.73 10.96 L0.73 3.18 L1.10 2.83 L1.50 2.83 C1.50 2.83 1.47 3.06 1.47 3.18 C1.47 3.38 1.83 3.54 1.83 3.54 L7.70 3.54 C7.70 3.54 8.07 3.38 8.07 3.18 C8.07 3.18 8.07 3.17 8.07 3.16 C8.07 3.05 8.04 2.83 8.04 2.83 L8.43 2.83 L8.80 3.18 L8.80 4.95 L5.13 4.95 L4.87 5.05 L3.04 6.82 L2.93 7.07 L2.93 11.31 Z M2.71 2.27 C3.00 2.13 3.30 2.12 3.30 2.12 C3.50 2.12 3.67 1.96 3.67 1.77 C3.67 1.18 4.16 0.71 4.77 0.71 C5.37 0.71 5.87 1.18 5.87 1.77 C5.87 1.96 6.03 2.12 6.23 2.12 C6.23 2.12 6.54 2.13 6.82 2.27 C7.06 2.39 7.29 2.83 7.29 2.83 L2.24 2.83 C2.24 2.83 2.47 2.39 2.71 2.27 Z M9.90 4.95 L9.53 4.95 L9.53 3.18 L8.43 2.12 L7.74 2.12 C7.74 2.12 7.38 1.75 7.13 1.63 C6.93 1.53 6.73 1.48 6.57 1.45 C6.41 0.63 5.66 0.00 4.77 0.00 C3.87 0.00 3.12 0.63 2.96 1.45 C2.80 1.48 2.60 1.53 2.40 1.63 C2.15 1.75 1.79 2.12 1.79 2.12 L1.10 2.12 L0.00 3.18 L0.00 10.96 L1.10 12.02 L2.93 12.02 L2.93 13.08 L4.03 14.14 L9.90 14.14 L11.00 13.08 L11.00 6.01 L9.90 4.95 Z"
                          ></path>
                        </svg>
                      </Fill11Stack>
                    </IconTickets>
                  </Rectangle4>
                </MenuTickets>
                <MenuProject>
                  <Rectangle3>
                    <IconProject>
                      <Path12StackStack>
                        <Path12Stack>
                          <svg
                            viewBox="0 0 3.89 3.11"
                            style={{
                              position: "absolute",
                              height: 3,
                              width: 4,
                              top: 3,
                              left: 7,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(136,136,136,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M3.11 1.56 C3.11 2.07 2.59 2.49 1.94 2.49 C1.30 2.49 0.78 2.07 0.78 1.56 C0.78 1.04 1.30 0.62 1.94 0.62 M3.89 1.56 C3.89 0.70 3.02 0.00 1.94 0.00 C0.87 0.00 0.00 0.70 0.00 1.56 C0.00 2.41 0.87 3.11 1.94 3.11 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 13.22 13.22"
                            style={{
                              position: "absolute",
                              height: 13,
                              width: 13,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(136,136,136,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M9.77 7.48 C9.77 7.48 6.83 9.05 6.61 9.05 C6.61 9.05 6.47 9.04 6.08 8.77 C5.82 8.59 5.50 8.32 5.21 8.02 C4.91 7.72 4.64 7.41 4.45 7.14 C4.18 6.76 4.18 6.61 4.18 6.61 C4.18 6.40 4.47 4.90 5.74 3.45 C7.27 1.72 9.61 0.77 12.52 0.70 C12.45 3.62 9.77 7.48 9.77 7.48 L9.77 7.48 Z M6.40 11.75 C6.40 11.75 6.40 11.75 6.40 11.75 C6.40 11.75 6.40 11.75 6.40 11.75 Z M6.95 9.71 C7.41 9.62 8.14 9.39 8.93 8.94 C8.56 10.06 6.47 11.69 6.40 11.75 C6.42 11.70 6.90 10.49 6.95 9.71 Z M1.47 6.83 C2.13 5.86 3.14 4.67 4.29 4.30 C3.83 5.09 3.60 5.81 3.52 6.27 C2.71 6.32 2.01 6.56 1.47 6.83 Z M12.87 0.00 C12.87 0.00 9.46 0.31 8.09 0.91 C6.96 1.41 6.00 2.11 5.22 2.99 C5.07 3.15 4.94 3.32 4.82 3.49 C4.22 3.53 3.60 3.76 2.99 4.20 C2.47 4.56 1.95 5.07 1.44 5.70 C0.59 6.76 0.06 7.80 0.04 7.85 C-0.04 8.00 0.01 8.19 0.14 8.28 C0.21 8.33 0.28 8.35 0.35 8.35 C0.44 8.35 0.53 8.32 0.59 8.25 C0.60 8.25 0.93 7.92 1.50 7.60 C1.96 7.33 2.69 7.02 3.56 6.97 C3.78 7.53 4.41 8.21 4.71 8.51 C5.02 8.81 5.69 9.44 6.25 9.66 C6.20 10.54 5.89 11.26 5.62 11.73 C5.30 12.29 4.98 12.63 4.97 12.63 C4.85 12.75 4.84 12.94 4.94 13.08 C5.00 13.17 5.11 13.22 5.22 13.22 C5.27 13.22 5.33 13.21 5.37 13.19 C5.42 13.16 6.46 12.64 7.53 11.78 C8.16 11.27 8.66 10.75 9.03 10.23 C9.46 9.62 9.70 9.01 9.74 8.41 C9.90 8.28 10.07 8.15 10.23 8.00 C11.11 7.23 11.81 6.26 12.31 5.13 C12.92 3.76 13.22 0.35 13.22 0.35 L13.22 0.00 L12.87 0.00 L12.87 0.00 Z"
                            ></path>
                          </svg>
                        </Path12Stack>
                        <svg
                          viewBox="0 0 4.67 4.67"
                          style={{
                            position: "absolute",
                            height: 5,
                            width: 5,
                            top: 9,
                            left: 0,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(136,136,136,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M3.20 0.66 C3.20 0.66 3.56 0.75 3.74 0.93 C3.96 1.15 4.04 1.37 3.99 1.60 C3.94 1.82 3.73 2.20 3.02 2.69 C2.50 3.05 1.79 3.41 0.90 3.76 C1.30 2.79 1.69 2.03 2.09 1.49 C2.49 0.95 3.20 0.66 3.20 0.66 L3.20 0.66 Z M0.33 4.67 C0.33 4.67 0.41 4.66 0.44 4.65 C3.00 3.72 4.41 2.74 4.64 1.74 C4.71 1.42 4.69 0.94 4.21 0.46 C3.90 0.15 3.56 0.00 3.20 0.00 C2.11 0.00 1.04 1.42 0.02 4.22 C-0.02 4.34 0.01 4.48 0.10 4.57 C0.16 4.63 0.33 4.67 0.33 4.67 Z"
                          ></path>
                        </svg>
                      </Path12StackStack>
                    </IconProject>
                  </Rectangle3>
                </MenuProject>
                <MyProfile1>
                  <MyProfile
                    src={require("./assets/images/8fb65c19677a1d8770ff89a500350d6b3aada798.png")}
                  ></MyProfile>
                </MyProfile1>
              </Menu>
            </LeftBg>
            <svg
              viewBox="-0.5 -0.5 3 718.5"
              style={{
                position: "absolute",
                height: 719,
                width: 3,
                top: 0,
                left: 73,
                backgroundColor: "transparent",
                borderColor: "transparent"
              }}
            >
              <path
                strokeWidth={1}
                fill="transparent"
                stroke="rgba(235,235,235,1)"
                fillOpacity={1}
                strokeOpacity={1}
                d="M0.50 0.00 L0.50 716.50 "
              ></path>
            </svg>
            <MyDirectChannels>
              <FilterRow>
                <Filter>
                  <AllChatsRow>
                    <AllChats>All Chats</AllChats>
                    <ChatTotalCount>
                      <ActiveChatCount>
                        <ActiveChatTotal>{activeChatTotal}</ActiveChatTotal>
                      </ActiveChatCount>
                    </ChatTotalCount>
                  </AllChatsRow>
                </Filter>
                <Sort>
                  <NewestRow>
                    <Newest>Newest</Newest>
                    <DropDown>
                      <svg
                        viewBox="-0.5 -0.5 7 4"
                        style={{
                          height: 4,
                          width: 7,
                          backgroundColor: "transparent",
                          borderColor: "transparent"
                        }}
                      >
                        <path
                          strokeWidth={1}
                          fill="rgba(85,85,85,1)"
                          stroke="rgba(85,85,85,1)"
                          fillOpacity={1}
                          strokeOpacity={1}
                          d="M2.50 0.00 L5.00 2.00 L0.00 2.00 L2.50 0.00 Z"
                        ></path>
                      </svg>
                      <svg
                        viewBox="-0.5 -0.5 7 4"
                        style={{
                          height: 4,
                          width: 7,
                          backgroundColor: "transparent",
                          borderColor: "transparent",
                          transform: "rotate(undefined)",
                          marginTop: 2
                        }}
                      >
                        <path
                          strokeWidth={1}
                          fill="rgba(85,85,85,1)"
                          stroke="rgba(85,85,85,1)"
                          fillOpacity={1}
                          strokeOpacity={1}
                          d="M2.50 0.00 L5.00 2.00 L0.00 2.00 L2.50 0.00 Z"
                        ></path>
                      </svg>
                    </DropDown>
                  </NewestRow>
                </Sort>
              </FilterRow>
              {activeUsers.map((activeUsers, activeUsersIndex) => {
                if (activeChatChannel.includes(activeUsers.uuid.replace(/\s/g, ''))) {
                  return (
                    <ActiveChatChannelSelected  key={`activeUsers-${activeUsersIndex}`} onClick={() => {openChat(activeUsers.uuid)}}>
                      <ActiveChatChannel>
                        <ActiveSenderRow>
                          <SenderInitialImage>
                            <SenderImageArea>
                              <SenderInitials>{activeUsers.initial}</SenderInitials>
                            </SenderImageArea>
                          </SenderInitialImage>
                          <SenderNameColumn>
                            <SenderNameActive>{activeUsers.uuid}</SenderNameActive>
                            <SenderCustomCompany4>Account: {activeUsers.account}</SenderCustomCompany4>
                          </SenderNameColumn>
                          <LastActiveMessageDuration>Active</LastActiveMessageDuration>
                        </ActiveSenderRow>
                        <ActiveChatAssignedRow>
                          <ActiveAssignedText id={`activeUserLast-${activeUsers.uuid}`}>
                          </ActiveAssignedText>
                          <AssignedAgentAvatar>
                            <AssignedAgentAvaterImage
                              src={require("./assets/images/8fb65c19677a1d8770ff89a500350d6b3aada798.png")}
                            ></AssignedAgentAvaterImage>
                          </AssignedAgentAvatar>
                        </ActiveChatAssignedRow>
                      </ActiveChatChannel>
                    </ActiveChatChannelSelected>
                  );
                } else {
                  return (
                    <ActiveChatChannel key={`activeUsers-${activeUsersIndex}`} onClick={() => {openChat(activeUsers.uuid)}}>
                      <ActiveSenderRow>
                        <SenderInitialImage>
                          <SenderImageArea>
                            <SenderInitials>{activeUsers.initial}</SenderInitials>
                          </SenderImageArea>
                        </SenderInitialImage>
                        <SenderNameColumn>
                          <SenderNameActive>{activeUsers.uuid}</SenderNameActive>
                          <SenderCustomCompany4>Account: {activeUsers.account}</SenderCustomCompany4>
                        </SenderNameColumn>
                        <LastActiveMessageDuration>Active</LastActiveMessageDuration>
                      </ActiveSenderRow>
                      <ActiveChatAssignedRow>
                        <ActiveAssignedText id={`activeUserLast-${activeUsers.uuid}`}>
                        </ActiveAssignedText>
                        <AssignedAgentAvatar>
                          <AssignedAgentAvaterImage
                            src={require("./assets/images/8fb65c19677a1d8770ff89a500350d6b3aada798.png")}
                          ></AssignedAgentAvaterImage>
                        </AssignedAgentAvatar>
                      </ActiveChatAssignedRow>
                    </ActiveChatChannel>
                  );
                }
              })}
              <div ref={divRefActive} />
            </MyDirectChannels>
          </LeftBgStack>
        </LeftMenu>
        <SelectedDirectChannel>
          <AssignedToRow>
            <AssignedTo>
              <AssignedToAgentRow>
                <AssignedToAgentLabel>Assigned to:</AssignedToAgentLabel>
                <List>
                  <AssignedAgentAvatarRow>
                    <AgentAvatarArea>
                      <AgentAvatarImage
                        src={require("./assets/images/8fb65c19677a1d8770ff89a500350d6b3aada798.png")}
                      ></AgentAvatarImage>
                    </AgentAvatarArea>
                    <AssignedToAgentName>Phil Byrne</AssignedToAgentName>
                    <svg
                      viewBox="-0.5 -0.5 7 4"
                      style={{
                        height: 4,
                        width: 7,
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        transform: "rotate(undefined)",
                        marginLeft: 21,
                        marginTop: 7
                      }}
                    >
                      <path
                        strokeWidth={1}
                        fill="rgba(85,85,85,1)"
                        stroke="rgba(85,85,85,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M2.50 0.00 L5.00 2.00 L0.00 2.00 L2.50 0.00 Z"
                      ></path>
                    </svg>
                  </AssignedAgentAvatarRow>
                </List>
              </AssignedToAgentRow>
            </AssignedTo>
            <ActionList>
              <TriangleStack>
                <svg
                  viewBox="-0.5 -0.5 7 4"
                  style={{
                    position: "absolute",
                    height: 4,
                    width: 7,
                    top: 14,
                    left: 139,
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    transform: "rotate(undefined)"
                  }}
                >
                  <path
                    strokeWidth={1}
                    fill="rgba(118,194,133,1)"
                    stroke="rgba(118,194,133,1)"
                    fillOpacity={1}
                    strokeOpacity={1}
                    d="M2.50 0.00 L5.00 2.00 L0.00 2.00 L2.50 0.00 Z"
                  ></path>
                </svg>
                <ResolvedSelector>
                  <MarkAsResolved>Mark as Resolved</MarkAsResolved>
                </ResolvedSelector>
              </TriangleStack>
            </ActionList>
          </AssignedToRow>
          <MessageListStack style={{overflow: "scroll"}}>
            <MessageList>
            {messages.map((message, messageIndex) => {
              if (message.sender === "agent") {
                return (
                  <MessageAgent key={`message-${messageIndex}`}>
                    <UserName>Phill Byrne (You)</UserName>
                    <AgentTextAreaStackRow>
                      <AgentTextAreaStack>
                        <AgentMessageText>
                          {message.message.replace(/<[^>]*>?/gm, '')}
                        </AgentMessageText>
                      </AgentTextAreaStack>
                      <AgentAvatarMessage>
                        <AgenAvatarImage
                          src={require("./assets/images/8fb65c19677a1d8770ff89a500350d6b3aada798.png")}
                        ></AgenAvatarImage>
                      </AgentAvatarMessage>
                    </AgentTextAreaStackRow>
                  </MessageAgent>
                );
              } else {
                return (
                  <Message key={`message-${messageIndex}`}>
                    <SenderName>{activeChatName}</SenderName>
                    <UserMessageStackRow>
                      <UserIconStack>
                        <SenderImage>
                          <UserSenderImage>
                            <SenderInitial>{activeChatName.charAt(0).toUpperCase()}</SenderInitial>
                          </UserSenderImage>
                        </SenderImage>
                      </UserIconStack>
                      <UserTextAreaStack>
                        <ActiveUserMessage>
                          {message.message.replace(/<[^>]*>?/gm, '')}
                        </ActiveUserMessage>
                      </UserTextAreaStack>
                    </UserMessageStackRow>
                  </Message>
                );
              }
            })}
            <div ref={divRef} />
            </MessageList>
          </MessageListStack>
          {emojiShow && <EmojiSelector>
            <Picker 
              showPreview={false}
              showSkinTones={false}
              onSelect={e => {setInput(input+e.native);toggleEmojiShow(!emojiShow);}}
            />
          </EmojiSelector>}
          <MessageInput>
            <TextAreaStack>
              <TextArea>
                <Input
                  type="text"
                  placeholder="Type your message"
                  value={input}
                  maxlength="250"
                  onChange={e => setInput(e.target.value)}
                />
                <svg
                  viewBox="-0.5 -0.5 54 3"
                  style={{
                    height: 3,
                    width: 54,
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    marginTop: 13,
                    marginLeft: 12
                  }}
                >
                  <path
                    strokeWidth={1}
                    fill="transparent"
                    stroke="rgba(99,135,237,1)"
                    fillOpacity={1}
                    strokeOpacity={1}
                    d="M0.49 0.50 L51.50 0.50 "
                  ></path>
                </svg>
                <SendRow>
                  <Send>Reply</Send>
                  <SendPrivate>Private Note</SendPrivate>
                  <EditToolbar>
                    <AddAttachmentsRow>
                      <svg
                        viewBox="0 0 7 15.56"
                        style={{
                          height: 16,
                          width: 7,
                          backgroundColor: "transparent",
                          borderColor: "transparent"
                        }}
                      >
                        <path
                          strokeWidth={0}
                          fill="rgba(170,170,170,1)"
                          fillOpacity={1}
                          strokeOpacity={1}
                          d="M3.50 15.56 C1.57 15.56 0.00 13.99 0.00 12.06 L0.00 2.72 C0.00 1.22 1.22 0.00 2.72 0.00 C4.22 0.00 5.44 1.22 5.44 2.72 L5.44 11.28 C5.44 12.35 4.57 13.22 3.50 13.22 C2.43 13.22 1.56 12.35 1.56 11.28 L1.56 6.61 C1.56 6.40 1.73 6.22 1.94 6.22 C2.16 6.22 2.33 6.40 2.33 6.61 L2.33 11.28 C2.33 11.92 2.86 12.44 3.50 12.44 C4.14 12.44 4.67 11.92 4.67 11.28 L4.67 2.72 C4.67 1.65 3.79 0.78 2.72 0.78 C1.65 0.78 0.78 1.65 0.78 2.72 L0.78 12.06 C0.78 13.56 2.00 14.78 3.50 14.78 C5.00 14.78 6.22 13.56 6.22 12.06 L6.22 6.61 C6.22 6.40 6.40 6.22 6.61 6.22 C6.83 6.22 7.00 6.40 7.00 6.61 L7.00 12.06 C7.00 13.99 5.43 15.56 3.50 15.56 "
                        ></path>
                      </svg>
                      <AddMarkdown>
                        <PathMarkdownStack>
                          <svg
                            viewBox="0 0 13 15.44"
                            style={{
                              position: "absolute",
                              height: 15,
                              width: 13,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M11.78 0.81 L12.19 1.22 L12.19 14.22 L11.78 14.63 L1.22 14.63 L0.81 14.22 L0.81 1.22 L1.22 0.81 Z M13.00 14.22 L13.00 1.22 L11.78 0.00 L1.22 0.00 L0.00 1.22 L0.00 14.22 L1.22 15.44 L11.78 15.44 L13.00 14.22 Z"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 6.5 0.81"
                            style={{
                              position: "absolute",
                              height: 1,
                              width: 7,
                              top: 2,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M6.09 0.81 L0.41 0.81 C0.18 0.81 0.00 0.63 0.00 0.41 C0.00 0.18 0.18 0.00 0.41 0.00 L6.09 0.00 C6.32 0.00 6.50 0.18 6.50 0.41 C6.50 0.63 6.32 0.81 6.09 0.81 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 8.13 0.81"
                            style={{
                              position: "absolute",
                              height: 1,
                              width: 8,
                              top: 4,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M7.72 0.81 L0.41 0.81 C0.18 0.81 0.00 0.63 0.00 0.41 C0.00 0.18 0.18 0.00 0.41 0.00 L7.72 0.00 C7.94 0.00 8.13 0.18 8.13 0.41 C8.13 0.63 7.94 0.81 7.72 0.81 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 8.13 0.81"
                            style={{
                              position: "absolute",
                              height: 1,
                              width: 8,
                              top: 6,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M7.72 0.81 L0.41 0.81 C0.18 0.81 0.00 0.63 0.00 0.41 C0.00 0.18 0.18 0.00 0.41 0.00 L7.72 0.00 C7.94 0.00 8.13 0.18 8.13 0.41 C8.13 0.63 7.94 0.81 7.72 0.81 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 4.88 0.81"
                            style={{
                              position: "absolute",
                              height: 1,
                              width: 5,
                              top: 7,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M4.47 0.81 L0.41 0.81 C0.18 0.81 0.00 0.63 0.00 0.41 C0.00 0.18 0.18 0.00 0.41 0.00 L4.47 0.00 C4.69 0.00 4.88 0.18 4.88 0.41 C4.88 0.63 4.69 0.81 4.47 0.81 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 8.13 0.81"
                            style={{
                              position: "absolute",
                              height: 1,
                              width: 8,
                              top: 11,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M7.72 0.81 L0.41 0.81 C0.18 0.81 0.00 0.63 0.00 0.41 C0.00 0.18 0.18 0.00 0.41 0.00 L7.72 0.00 C7.94 0.00 8.13 0.18 8.13 0.41 C8.13 0.63 7.94 0.81 7.72 0.81 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 6.5 0.81"
                            style={{
                              position: "absolute",
                              height: 1,
                              width: 7,
                              top: 12,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M6.09 0.81 L0.41 0.81 C0.18 0.81 0.00 0.63 0.00 0.41 C0.00 0.18 0.18 0.00 0.41 0.00 L6.09 0.00 C6.32 0.00 6.50 0.18 6.50 0.41 C6.50 0.63 6.32 0.81 6.09 0.81 "
                            ></path>
                          </svg>
                        </PathMarkdownStack>
                      </AddMarkdown>
                      <AddEmoji onClick={() => {toggleEmojiShow(!emojiShow)}}>
                        <PathEmojiStack>
                          <svg
                            viewBox="0 0 16 16"
                            style={{
                              position: "absolute",
                              height: 16,
                              width: 16,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8,0.842105263 C4.05305263,0.842105263 0.842105263,4.05305263 0.842105263,8 C0.842105263,11.9477895 4.05305263,15.1578947 8,15.1578947 C11.9469474,15.1578947 15.1578947,11.9477895 15.1578947,8 C15.1578947,4.05305263 11.9469474,0.842105263 8,0.842105263 M8,16 C5.86273684,16 3.85431579,15.168 2.34273684,13.6572632 C0.831157895,12.1465263 0,10.1372632 0,8.00084211 C0,5.86357895 0.832,3.85515789 2.34273684,2.34357895 C3.85347368,0.832 5.86273684,0 8,0 C10.1372632,0 12.1456842,0.832 13.6572632,2.34357895 C15.1688421,3.85515789 16,5.86357895 16,8.00084211 C16,10.1381053 15.168,12.1465263 13.6572632,13.6572632 C12.1465263,15.168 10.1372632,16 8,16"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 10.95 3.37"
                            style={{
                              position: "absolute",
                              height: 3,
                              width: 11,
                              top: 3,
                              left: 3,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M6.96 2.53 C6.96 2.53 6.74 1.98 6.74 1.69 C6.74 1.57 6.75 1.46 6.77 1.36 C6.77 1.35 6.77 1.35 6.77 1.35 C6.81 1.17 6.96 0.84 6.96 0.84 L9.88 0.84 C9.88 0.84 10.11 1.39 10.11 1.69 C10.11 1.98 9.88 2.53 9.88 2.53 Z M1.07 2.53 C1.07 2.53 0.84 1.98 0.84 1.69 C0.84 1.39 1.07 0.84 1.07 0.84 L3.99 0.84 C3.99 0.84 4.14 1.17 4.18 1.35 C4.18 1.35 4.18 1.35 4.18 1.36 C4.20 1.46 4.21 1.57 4.21 1.69 C4.21 1.98 3.99 2.53 3.99 2.53 Z M10.44 0.17 L10.11 0.00 L6.74 0.00 C6.74 0.00 6.48 0.06 6.40 0.17 C6.24 0.38 6.04 0.84 6.04 0.84 L4.91 0.84 C4.91 0.84 4.70 0.38 4.55 0.17 C4.47 0.06 4.21 0.00 4.21 0.00 L0.84 0.00 C0.84 0.00 0.59 0.06 0.51 0.17 C0.17 0.61 0.00 1.13 0.00 1.69 C0.00 2.24 0.18 2.76 0.51 3.20 C0.58 3.31 0.84 3.37 0.84 3.37 L4.21 3.37 C4.21 3.37 4.47 3.31 4.55 3.20 C4.88 2.76 5.05 1.69 5.05 1.69 L5.89 1.69 C5.89 1.69 6.07 2.76 6.40 3.20 C6.48 3.31 6.74 3.37 6.74 3.37 L10.11 3.37 C10.11 3.37 10.36 3.31 10.44 3.20 C10.77 2.76 10.95 2.24 10.95 1.69 C10.95 1.14 10.44 0.17 10.44 0.17 Z"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 8.35 5.05"
                            style={{
                              position: "absolute",
                              height: 5,
                              width: 8,
                              top: 8,
                              left: 3,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M5.40 5.05 C4.10 5.05 2.84 4.59 1.85 3.74 C0.87 2.91 0.22 1.75 0.01 0.49 C-0.03 0.26 0.12 0.04 0.35 0.01 C0.58 -0.03 0.80 0.12 0.84 0.35 C1.21 2.59 3.13 4.21 5.40 4.21 C6.22 4.21 7.02 4.00 7.72 3.59 C7.92 3.47 8.18 3.54 8.29 3.74 C8.41 3.95 8.34 4.20 8.14 4.32 C7.31 4.80 6.37 5.05 5.40 5.05 Z"
                            ></path>
                          </svg>
                        </PathEmojiStack>
                      </AddEmoji>
                      <AddCodeSnippet>
                        <Path10Stack>
                          <svg
                            viewBox="0 0 17 13.6"
                            style={{
                              position: "absolute",
                              height: 14,
                              width: 17,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M15.72 0.85 L16.15 1.27 L16.15 12.32 L15.72 12.75 L1.27 12.75 L0.85 12.32 L0.85 1.27 L1.27 0.85 Z M17.00 12.32 L17.00 1.27 L15.72 0.00 L1.27 0.00 L0.00 1.27 L0.00 12.32 L1.27 13.60 L15.72 13.60 L17.00 12.32 Z"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 3.4 4.25"
                            style={{
                              position: "absolute",
                              height: 4,
                              width: 3,
                              top: 3,
                              left: 3,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M0.43 4.25 C0.29 4.25 0.15 4.18 0.07 4.06 C-0.06 3.86 -0.01 3.60 0.19 3.47 L2.21 2.12 L0.19 0.78 C-0.01 0.65 -0.06 0.38 0.07 0.19 C0.20 -0.01 0.47 -0.06 0.66 0.07 L3.21 1.77 C3.33 1.85 3.40 1.98 3.40 2.12 C3.40 2.27 3.33 2.40 3.21 2.48 L0.66 4.18 C0.59 4.23 0.51 4.25 0.42 4.25 Z"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 3.4 0.85"
                            style={{
                              position: "absolute",
                              height: 1,
                              width: 3,
                              top: 6,
                              left: 7,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(170,170,170,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M2.98 0.85 L0.42 0.85 C0.19 0.85 0.00 0.66 0.00 0.42 C0.00 0.19 0.19 0.00 0.42 0.00 L2.98 0.00 C3.21 0.00 3.40 0.19 3.40 0.42 C3.40 0.66 3.21 0.85 2.98 0.85 "
                            ></path>
                          </svg>
                        </Path10Stack>
                      </AddCodeSnippet>
                    </AddAttachmentsRow>
                  </EditToolbar>
                </SendRow>
              </TextArea>
            </TextAreaStack>
          </MessageInput>
        </SelectedDirectChannel>
        <InfoPanel>
          <RightBg>
            <User>
              <Info>Visitor Information</Info>
              <PresenceStackRow>
                <PresenceStack>
                  <UserAvatar>
                    <UserImage>
                      {activeChatName 
                      ? <UserInitial>{activeChatName.charAt(0).toUpperCase()}</UserInitial>
                      : <UserInitial>?</UserInitial>
                      }
                    </UserImage>
                  </UserAvatar>
                </PresenceStack>
                 {activeChatChannel 
                  ? <SelectedName>{activeChatName}</SelectedName>
                  : <SelectedName>Select Customer</SelectedName>
                  }
              </PresenceStackRow>
              <IconCompanyRow>
                <IconCompany>
                  <Oval3Stack>
                    <svg
                      viewBox="0 0 30 30"
                      style={{
                        position: "absolute",
                        height: 30,
                        width: 30,
                        top: 0,
                        left: 0,
                        backgroundColor: "transparent",
                        borderColor: "transparent"
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(145,118,194,0.1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M15.00 30.00 C23.28 30.00 30.00 23.28 30.00 15.00 C30.00 6.72 23.28 0.00 15.00 0.00 C6.72 0.00 0.00 6.72 0.00 15.00 C0.00 23.28 6.72 30.00 15.00 30.00 Z"
                      ></path>
                    </svg>
                    <svg
                      viewBox="0 0 16 13.6"
                      style={{
                        position: "absolute",
                        height: 14,
                        width: 16,
                        top: 7,
                        left: 7,
                        backgroundColor: "transparent",
                        borderColor: "transparent"
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(145,118,194,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M14.80 12.80 L1.20 12.80 L0.80 12.40 L0.80 10.40 L2.40 10.40 L2.40 10.80 L2.80 11.20 L4.40 11.20 L4.80 10.80 L4.80 10.40 L11.20 10.40 L11.20 10.80 L11.60 11.20 L13.20 11.20 L13.60 10.80 L13.60 10.40 L15.20 10.40 L15.20 12.40 L14.80 12.80 Z M3.20 9.60 L4.00 9.60 L4.00 10.40 L3.20 10.40 Z M12.00 9.60 L12.80 9.60 L12.80 10.40 L12.00 10.40 Z M1.20 3.20 L14.80 3.20 L15.20 3.60 L15.20 9.60 L13.60 9.60 L13.60 9.20 L13.20 8.80 L11.60 8.80 L11.20 9.20 L11.20 9.60 L4.80 9.60 L4.80 9.20 L4.40 8.80 L2.80 8.80 L2.40 9.20 L2.40 9.60 L0.80 9.60 L0.80 3.60 L1.20 3.20 Z M5.60 1.20 L6.00 0.80 L10.00 0.80 L10.40 1.20 L10.40 2.40 L5.60 2.40 Z M14.80 2.40 L11.20 2.40 L11.20 1.20 L10.00 0.00 L6.00 0.00 L4.80 1.20 L4.80 2.40 L1.20 2.40 L0.00 3.60 L0.00 12.40 L1.20 13.60 L14.80 13.60 L16.00 12.40 L16.00 3.60 L14.80 2.40 Z"
                      ></path>
                    </svg>
                  </Oval3Stack>
                </IconCompany>
                {activeChatChannel 
                  ? <CompanyName>{accountFromUUID(activeChatName.replace(/\s/g, ''))}</CompanyName>
                  : <CompanyName>NA</CompanyName>
                  }
              </IconCompanyRow>
              <IconEmailRow>
                <IconEmail>
                  <OvalCopyStack>
                    <svg
                      viewBox="0 0 30 30"
                      style={{
                        position: "absolute",
                        height: 30,
                        width: 30,
                        top: 0,
                        left: 0,
                        backgroundColor: "transparent",
                        borderColor: "transparent"
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(229,104,98,0.1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M15.00 30.00 C23.28 30.00 30.00 23.28 30.00 15.00 C30.00 6.72 23.28 0.00 15.00 0.00 C6.72 0.00 0.00 6.72 0.00 15.00 C0.00 23.28 6.72 30.00 15.00 30.00 Z"
                      ></path>
                    </svg>
                    <svg
                      viewBox="0 0 15 10.8"
                      style={{
                        position: "absolute",
                        height: 11,
                        width: 15,
                        top: 9,
                        left: 8,
                        backgroundColor: "transparent",
                        borderColor: "transparent"
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(229,104,98,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M14.03 1.59 L14.03 9.22 C14.03 9.22 11.55 6.67 10.31 5.40 C11.55 4.13 14.03 1.59 14.03 1.59 Z M0.97 1.59 C0.97 1.59 3.45 4.13 4.69 5.40 C3.45 6.67 0.97 9.22 0.97 9.22 Z M1.58 9.92 C1.58 9.92 4.08 7.36 5.33 6.08 C5.77 6.53 6.20 6.97 6.64 7.41 C6.75 7.52 6.86 7.64 6.98 7.75 C7.30 8.08 7.70 8.08 8.02 7.75 C8.53 7.24 9.04 6.72 9.55 6.20 C9.58 6.16 9.62 6.12 9.67 6.08 C10.92 7.36 13.42 9.92 13.42 9.92 Z M13.46 0.89 C13.46 0.89 9.49 4.95 7.50 6.98 C5.51 4.95 1.54 0.89 1.54 0.89 Z M0.94 0.01 C0.79 0.01 0.63 0.04 0.50 0.10 C0.15 0.27 0.00 0.56 0.00 0.92 C0.00 3.91 0.00 6.90 0.00 9.89 C0.00 10.45 0.39 10.80 1.00 10.80 C5.34 10.80 9.67 10.80 14.01 10.80 C14.61 10.80 15.00 10.45 15.00 9.90 C15.00 6.90 14.99 3.91 15.00 0.91 C15.00 0.37 14.53 -0.00 14.00 0.00 C11.83 0.01 9.67 0.01 7.50 0.01 C5.31 0.01 3.13 0.00 0.94 0.01 Z"
                      ></path>
                    </svg>
                  </OvalCopyStack>
                </IconEmail>
                {activeChatChannel 
                  ? <Email>{activeChatName.replace(/\s/g, '')}@pubnub.com</Email>
                  : <Email>NA</Email>
                  }
              </IconEmailRow>
              <IconLocationRow>
                <IconLocation>
                  <OvalCopy2Stack>
                    <svg
                      viewBox="0 0 30 30"
                      style={{
                        position: "absolute",
                        height: 30,
                        width: 30,
                        top: 0,
                        left: 0,
                        backgroundColor: "transparent",
                        borderColor: "transparent"
                      }}
                    >
                      <path
                        strokeWidth={0}
                        fill="rgba(118,194,133,0.1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M15.00 30.00 C23.28 30.00 30.00 23.28 30.00 15.00 C30.00 6.72 23.28 0.00 15.00 0.00 C6.72 0.00 0.00 6.72 0.00 15.00 C0.00 23.28 6.72 30.00 15.00 30.00 Z"
                      ></path>
                    </svg>
                    <IconLocation1>
                      <Path4Stack>
                        <svg
                          viewBox="0 0 9 15"
                          style={{
                            position: "absolute",
                            height: 15,
                            width: 9,
                            top: 0,
                            left: 0,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(118,194,133,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M8.25 4.50 C8.25 6.94 7.16 9.49 6.24 11.20 C5.56 12.47 4.88 13.47 4.50 14.00 C4.12 13.47 3.44 12.47 2.77 11.21 C1.85 9.50 0.75 6.94 0.75 4.50 C0.75 2.43 2.43 0.75 4.50 0.75 C6.57 0.75 8.25 2.43 8.25 4.50 Z M4.50 15.00 C4.50 15.00 4.72 14.95 4.80 14.86 C4.84 14.80 5.86 13.50 6.89 11.57 C7.50 10.43 7.99 9.32 8.34 8.26 C8.78 6.92 9.00 5.65 9.00 4.50 C9.00 2.02 6.98 0.00 4.50 0.00 C2.02 0.00 0.00 2.02 0.00 4.50 C0.00 5.65 0.22 6.92 0.66 8.26 C1.01 9.32 1.50 10.43 2.11 11.57 C3.14 13.50 4.16 14.80 4.20 14.86 C4.28 14.95 4.50 15.00 4.50 15.00 Z"
                          ></path>
                        </svg>
                        <svg
                          viewBox="0 0 4.5 4.5"
                          style={{
                            position: "absolute",
                            height: 5,
                            width: 5,
                            top: 2,
                            left: 2,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={0}
                            fill="rgba(118,194,133,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M3.75 2.25 C3.75 3.08 3.08 3.75 2.25 3.75 C1.42 3.75 0.75 3.08 0.75 2.25 C0.75 1.42 1.42 0.75 2.25 0.75 M4.50 2.25 C4.50 1.01 3.49 0.00 2.25 0.00 C1.01 0.00 0.00 1.01 0.00 2.25 C0.00 3.49 1.01 4.50 2.25 4.50 "
                          ></path>
                        </svg>
                      </Path4Stack>
                    </IconLocation1>
                  </OvalCopy2Stack>
                </IconLocation>
                {activeChatChannel 
                  ? <CompanyLocation>SF, CA</CompanyLocation>
                  : <CompanyLocation>NA</CompanyLocation>
                  }
              </IconLocationRow>
            </User>
            <OtherUserInfo>
              <PastVisitsRow>
                <PastVisits>
                  <Rectangle>
                    <Style>24</Style>
                    <PastVisits1>Past visits</PastVisits1>
                  </Rectangle>
                </PastVisits>
                <PastChats>
                  <Rectangle1>
                    <Style1>5</Style1>
                    <PastChats1>Past chats</PastChats1>
                  </Rectangle1>
                </PastChats>
                <TimeOnSite>
                  <Rectangle2>
                    <M12S>5m 12s</M12S>
                    <TimeOnSite1>Time on site</TimeOnSite1>
                  </Rectangle2>
                </TimeOnSite>
              </PastVisitsRow>
            </OtherUserInfo>
            <Tickets>
              <Ticket3>Timeline</Ticket3>
              <Ticket>
                <LogoRow>
                  <Logo>
                    <OvalStack>
                      <svg
                        viewBox="0 0 30 30"
                        style={{
                          position: "absolute",
                          height: 30,
                          width: 30,
                          top: 0,
                          left: 0,
                          backgroundColor: "transparent",
                          borderColor: "transparent"
                        }}
                      >
                        <path
                          strokeWidth={0}
                          fill="rgba(99,135,237,0.1)"
                          fillOpacity={1}
                          strokeOpacity={1}
                          d="M15.00 30.00 C23.28 30.00 30.00 23.28 30.00 15.00 C30.00 6.72 23.28 0.00 15.00 0.00 C6.72 0.00 0.00 6.72 0.00 15.00 C0.00 23.28 6.72 30.00 15.00 30.00 Z"
                        ></path>
                      </svg>
                      <IconTicket>
                        <PathStack>
                          <svg
                            viewBox="0 0 16 7.2"
                            style={{
                              position: "absolute",
                              height: 7,
                              width: 16,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 0.83 L14.57 3.60 L8.00 6.37 L1.43 3.60 L8.00 0.83 Z M8.16 7.17 L15.76 3.97 C15.76 3.97 16.00 3.76 16.00 3.60 C16.00 3.44 15.76 3.23 15.76 3.23 L8.16 0.03 L7.84 0.03 L0.24 3.23 C0.24 3.23 0.00 3.44 0.00 3.60 C0.00 3.76 0.24 3.97 0.24 3.97 L7.84 7.17 C7.84 7.17 7.95 7.20 8.00 7.20 C8.05 7.20 8.16 7.17 8.16 7.17 Z"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 16 4"
                            style={{
                              position: "absolute",
                              height: 4,
                              width: 16,
                              top: 6,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 4.00 C7.95 4.00 7.89 3.99 7.84 3.97 L0.24 0.77 C0.04 0.68 -0.05 0.45 0.03 0.24 C0.12 0.04 0.35 -0.05 0.56 0.03 L8.00 3.17 L15.44 0.03 C15.65 -0.05 15.88 0.04 15.97 0.24 C16.05 0.45 15.96 0.68 15.76 0.77 L8.16 3.97 C8.11 3.99 8.05 4.00 8.00 4.00 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 16 4"
                            style={{
                              position: "absolute",
                              height: 4,
                              width: 16,
                              top: 8,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 4.00 C7.95 4.00 7.89 3.99 7.84 3.97 L0.24 0.77 C0.04 0.68 -0.05 0.45 0.03 0.24 C0.12 0.04 0.35 -0.05 0.56 0.03 L8.00 3.17 L15.44 0.03 C15.65 -0.05 15.88 0.04 15.97 0.24 C16.05 0.45 15.96 0.68 15.76 0.77 L8.16 3.97 C8.11 3.99 8.05 4.00 8.00 4.00 "
                            ></path>
                          </svg>
                        </PathStack>
                      </IconTicket>
                    </OvalStack>
                  </Logo>
                  <IdColumn>
                    <Id>#52414</Id>
                    <Name>Credit card expired</Name>
                  </IdColumn>
                </LogoRow>
                <Status>Status: Closed</Status>
                <Created>May 4, 2020, 01:49 PM</Created>
              </Ticket>
              <Ticket1>
                <Logo1Row>
                  <Logo1>
                    <Oval1Stack>
                      <svg
                        viewBox="0 0 30 30"
                        style={{
                          position: "absolute",
                          height: 30,
                          width: 30,
                          top: 0,
                          left: 0,
                          backgroundColor: "transparent",
                          borderColor: "transparent"
                        }}
                      >
                        <path
                          strokeWidth={0}
                          fill="rgba(99,135,237,0.1)"
                          fillOpacity={1}
                          strokeOpacity={1}
                          d="M15.00 30.00 C23.28 30.00 30.00 23.28 30.00 15.00 C30.00 6.72 23.28 0.00 15.00 0.00 C6.72 0.00 0.00 6.72 0.00 15.00 C0.00 23.28 6.72 30.00 15.00 30.00 Z"
                        ></path>
                      </svg>
                      <IconTicket1>
                        <Path1Stack>
                          <svg
                            viewBox="0 0 16 7.2"
                            style={{
                              position: "absolute",
                              height: 7,
                              width: 16,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 0.83 L14.57 3.60 L8.00 6.37 L1.43 3.60 L8.00 0.83 Z M8.16 7.17 L15.76 3.97 C15.76 3.97 16.00 3.76 16.00 3.60 C16.00 3.44 15.76 3.23 15.76 3.23 L8.16 0.03 L7.84 0.03 L0.24 3.23 C0.24 3.23 0.00 3.44 0.00 3.60 C0.00 3.76 0.24 3.97 0.24 3.97 L7.84 7.17 C7.84 7.17 7.95 7.20 8.00 7.20 C8.05 7.20 8.16 7.17 8.16 7.17 Z"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 16 4"
                            style={{
                              position: "absolute",
                              height: 4,
                              width: 16,
                              top: 6,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 4.00 C7.95 4.00 7.89 3.99 7.84 3.97 L0.24 0.77 C0.04 0.68 -0.05 0.45 0.03 0.24 C0.12 0.04 0.35 -0.05 0.56 0.03 L8.00 3.17 L15.44 0.03 C15.65 -0.05 15.88 0.04 15.97 0.24 C16.05 0.45 15.96 0.68 15.76 0.77 L8.16 3.97 C8.11 3.99 8.05 4.00 8.00 4.00 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 16 4"
                            style={{
                              position: "absolute",
                              height: 4,
                              width: 16,
                              top: 8,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 4.00 C7.95 4.00 7.89 3.99 7.84 3.97 L0.24 0.77 C0.04 0.68 -0.05 0.45 0.03 0.24 C0.12 0.04 0.35 -0.05 0.56 0.03 L8.00 3.17 L15.44 0.03 C15.65 -0.05 15.88 0.04 15.97 0.24 C16.05 0.45 15.96 0.68 15.76 0.77 L8.16 3.97 C8.11 3.99 8.05 4.00 8.00 4.00 "
                            ></path>
                          </svg>
                        </Path1Stack>
                      </IconTicket1>
                    </Oval1Stack>
                  </Logo1>
                  <Id1Column>
                    <Id1>#34517</Id1>
                    <Name1>Technical outage</Name1>
                  </Id1Column>
                </Logo1Row>
                <Status1>Status: In-Progress</Status1>
                <Created1>Feb 21, 2020, 11:29 AM</Created1>
              </Ticket1>
              <Ticket2>
                <Logo2Row>
                  <Logo2>
                    <Oval2Stack>
                      <svg
                        viewBox="0 0 30 30"
                        style={{
                          position: "absolute",
                          height: 30,
                          width: 30,
                          top: 0,
                          left: 0,
                          backgroundColor: "transparent",
                          borderColor: "transparent"
                        }}
                      >
                        <path
                          strokeWidth={0}
                          fill="rgba(99,135,237,0.1)"
                          fillOpacity={1}
                          strokeOpacity={1}
                          d="M15.00 30.00 C23.28 30.00 30.00 23.28 30.00 15.00 C30.00 6.72 23.28 0.00 15.00 0.00 C6.72 0.00 0.00 6.72 0.00 15.00 C0.00 23.28 6.72 30.00 15.00 30.00 Z"
                        ></path>
                      </svg>
                      <IconTicket2>
                        <Path2Stack>
                          <svg
                            viewBox="0 0 16 7.2"
                            style={{
                              position: "absolute",
                              height: 7,
                              width: 16,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 0.83 L14.57 3.60 L8.00 6.37 L1.43 3.60 L8.00 0.83 Z M8.16 7.17 L15.76 3.97 C15.76 3.97 16.00 3.76 16.00 3.60 C16.00 3.44 15.76 3.23 15.76 3.23 L8.16 0.03 L7.84 0.03 L0.24 3.23 C0.24 3.23 0.00 3.44 0.00 3.60 C0.00 3.76 0.24 3.97 0.24 3.97 L7.84 7.17 C7.84 7.17 7.95 7.20 8.00 7.20 C8.05 7.20 8.16 7.17 8.16 7.17 Z"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 16 4"
                            style={{
                              position: "absolute",
                              height: 4,
                              width: 16,
                              top: 6,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 4.00 C7.95 4.00 7.89 3.99 7.84 3.97 L0.24 0.77 C0.04 0.68 -0.05 0.45 0.03 0.24 C0.12 0.04 0.35 -0.05 0.56 0.03 L8.00 3.17 L15.44 0.03 C15.65 -0.05 15.88 0.04 15.97 0.24 C16.05 0.45 15.96 0.68 15.76 0.77 L8.16 3.97 C8.11 3.99 8.05 4.00 8.00 4.00 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 16 4"
                            style={{
                              position: "absolute",
                              height: 4,
                              width: 16,
                              top: 8,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(99,135,237,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M8.00 4.00 C7.95 4.00 7.89 3.99 7.84 3.97 L0.24 0.77 C0.04 0.68 -0.05 0.45 0.03 0.24 C0.12 0.04 0.35 -0.05 0.56 0.03 L8.00 3.17 L15.44 0.03 C15.65 -0.05 15.88 0.04 15.97 0.24 C16.05 0.45 15.96 0.68 15.76 0.77 L8.16 3.97 C8.11 3.99 8.05 4.00 8.00 4.00 "
                            ></path>
                          </svg>
                        </Path2Stack>
                      </IconTicket2>
                    </Oval2Stack>
                  </Logo2>
                  <Id2Column>
                    <Id2>#19845</Id2>
                    <Name2>Free trial account glitch</Name2>
                  </Id2Column>
                </Logo2Row>
                <Status2>Status: In-Progress</Status2>
                <Created2>Jan 4, 2020, 04:39 PM</Created2>
              </Ticket2>
            </Tickets>
          </RightBg>
        </InfoPanel>
      </LeftMenuRow>
    </Container>
  );  
};
 
const App = () => {
  return (
    <PubNubProvider client={pubnub}>
      <SupportDashboard />
    </PubNubProvider>
  );
};

/* Styles */

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  height: 100%;
  width: 100%;
`;

const EmojiSelector = styled.div`
  position: absolute;
  z-index:99;
  right: 150;
  bottom: 2;
`;

const Input = styled.input`
  height: 60px;
  margin: 0px;
  padding: 15px;
  border-radius: 10px 10px 0px 0px;
  border: 0;
  border-bottom: 1px solid rgba(235,235,235,1);
  line-height: 17px;
  background-color: transparent;
  font-family: Arial;
  font-size: 13px;
`;

const LeftMenu = styled.div`
  height: 100%;
  width: 307px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const LeftBg = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 100%;
  width: 306px;
  background-color: rgba(255,255,255,1);
  flex-direction: column;
  display: flex;
`;

const Menu = styled.div`
  height: 100%;
  width: 42px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 28px;
  margin-left: 17px;
`;

const PubNubLogo = styled.div`
  height: 9px;
  width: 42px;
  opacity: 1;
  flex-direction: row;
  display: flex;
`;

const PathRow = styled.div`
  height: 9px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const MenuTarget = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 84px;
  margin-left: 6px;
`;

const Rectangle8 = styled.div`
  height: 30px;
  width: 30px;
  border-radius: 10px;
  background-color: rgba(247,247,247,1);
  flex-direction: column;
  display: flex;
`;

const IconTarget = styled.div`
  height: 14px;
  width: 14px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 8px;
  margin-left: 8px;
`;

const FillStack = styled.div`
  width: 14px;
  height: 14px;
  position: relative;
`;

const MenuGroup = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 47px;
  margin-left: 6px;
`;

const MenuGroupArea = styled.div`
  height: 30px;
  width: 30px;
  border-radius: 10px;
  background-color: rgba(247,247,247,1);
  flex-direction: column;
  display: flex;
`;

const IconGroup = styled.div`
  height: 12px;
  width: 15px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 8px;
  margin-left: 8px;
`;

const MenugGroupPathStack = styled.div`
  top: 3px;
  left: 2px;
  width: 13px;
  height: 9px;
  position: absolute;
`;

const MenuGroupStack = styled.div`
  width: 15px;
  height: 12px;
  position: relative;
`;

const SelectedMessages = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 45px;
  margin-left: 6px;
`;

const AssignedToAgentLabel = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  letter-spacing: -0.2387179487179489px;
  margin-top: 6px;
`;

const SelectedMessagesGroup = styled.div`
  height: 30px;
  width: 30px;
  border-radius: 10px;
  background-color: rgba(99,135,237,1);
  flex-direction: column;
  display: flex;
`;

const IconMesssages = styled.div`
  height: 15px;
  width: 16px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 9px;
  margin-left: 7px;
`;

const PathSelectedStack = styled.div`
  width: 16px;
  height: 14px;
  position: relative;
`;

const MenuCalendar = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 45px;
  margin-left: 6px;
`;

const Rectangle5 = styled.div`
  height: 30px;
  width: 30px;
  border-radius: 10px;
  background-color: rgba(247,247,247,1);
  flex-direction: column;
  display: flex;
`;

const IconCalendar = styled.div`
  height: 12px;
  width: 14px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 9px;
  margin-left: 8px;
`;

const Path16Stack = styled.div`
  width: 14px;
  height: 12px;
  position: relative;
`;

const MenuTickets = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 47px;
  margin-left: 6px;
`;

const Rectangle4 = styled.div`
  height: 30px;
  width: 30px;
  border-radius: 10px;
  background-color: rgba(247,247,247,1);
  flex-direction: column;
  display: flex;
`;

const IconTickets = styled.div`
  height: 14px;
  width: 11px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 8px;
  margin-left: 10px;
`;

const Fill11Stack = styled.div`
  width: 11px;
  height: 14px;
  position: relative;
`;

const MenuProject = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 47px;
  margin-left: 6px;
`;

const Rectangle3 = styled.div`
  height: 30px;
  width: 30px;
  border-radius: 10px;
  background-color: rgba(247,247,247,1);
  flex-direction: column;
  display: flex;
`;

const IconProject = styled.div`
  height: 14px;
  width: 14px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 8px;
  margin-left: 8px;
`;

const Path12Stack = styled.div`
  top: 0px;
  left: 1px;
  width: 13px;
  height: 13px;
  position: absolute;
`;

const Path12StackStack = styled.div`
  width: 14px;
  height: 14px;
  position: relative;
`;

const MyProfile1 = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
  margin-top: 134px;
  margin-left: 6px;
`;

const MyProfile = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const MyDirectChannels = styled.div`
  position: absolute;
  top: 20px;
  left: 75px;
  height: 680px;
  width: 232px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const Filter = styled.div`
  height: 25px;
  width: 97px;
  opacity: 1;
  flex-direction: row;
  display: flex;
`;

const AllChats = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  letter-spacing: -0.2387179487179489px;
  margin-top: 5px;
`;

const ChatTotalCount = styled.div`
  height: 25px;
  width: 25px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 7px;
`;

const ActiveChatCount = styled.div`
  height: 25px;
  width: 25px;
  border-radius: 10px;
  background-color: rgba(247,247,247,1);
  flex-direction: column;
  display: flex;
`;

const ActiveChatTotal = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 10px;
  letter-spacing: -0.1705128205128205px;
  margin-top: 7px;
  margin: auto;
`;

const AllChatsRow = styled.div`
  height: 25px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const Sort = styled.div`
  height: 15px;
  width: 50px;
  opacity: 1;
  flex-direction: row;
  display: flex;
  margin-left: 45px;
  margin-top: 5px;
`;

const Newest = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
`;

const DropDown = styled.div`
  height: 9px;
  width: 5px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 4px;
  margin-top: 3px;
`;

const NewestRow = styled.div`
  height: 15px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const FilterRow = styled.div`
  height: 25px;
  flex-direction: row;
  display: flex;
  margin-left: 22px;
  margin-right: 18px;
`;

const ActiveChatChannel = styled.div`
  height: 66px;
  width: 213px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  padding-top: 15px;
  padding-left: 18px;
  cursor: pointer;
`;

const ActiveChatChannelSelected = styled.div`
  background-color: rgba(99,135,237,0.15);
`;

const SenderInitialImage = styled.div`
  height: 28px;
  width: 28px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 1px;
`;

const SenderImageArea = styled.div`
  height: 28px;
  width: 28px;
  border-radius: 8px;
  background-color: rgba(237,171,99,1);
  flex-direction: column;
  display: flex;
`;

const SenderInitials = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(255,255,255,1);
  font-size: 16px;
  letter-spacing: -0.2728205128205129px;
  margin: auto;
`;

const SenderNameActive = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(74,74,74,1);
  font-size: 11px;
  letter-spacing: -0.2046153846153847px;
`;

const SenderCustomCompany4 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(74,74,74,1);
  font-size: 10px;
  letter-spacing: -0.1705128205128206px;
  margin-top: 2px;
`;

const SenderNameColumn = styled.div`
  width: 100px;
  flex-direction: column;
  display: flex;
  margin-left: 11px;
`;

const LastActiveMessageDuration = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: right;
  color: rgba(74,74,74,1);
  font-size: 12px;
  position: relative;
  letter-spacing: -0.2046153846153847px;
  margin-left: auto;
  margin-right: 15px;
`;

const ActiveSenderRow = styled.div`
  height: 29px;
  flex-direction: row;
  display: flex;
  margin-right: 1px;
`;

const ActiveAssignedText = styled.span`
  font-family: Arial;
  height: 28px;
  width: 171px;
  opacity: 1;
  background-color: transparent;
  color: rgba(74,74,74,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
`;

const AssignedAgentAvatar = styled.div`
  height: 20px;
  width: 20px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
  margin-bottom: 10px;
  margin-right: 10px;
`;

const AssignedAgentAvaterImage = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const ActiveChatAssignedRow = styled.div`
  height: 28px;
  flex-direction: row;
  display: flex;
  margin-top: 9px;
  margin-left: 1px;
`;

const LeftBgStack = styled.div`
  width: 307px;
  height: 719px;
  position: relative;
`;

const SelectedDirectChannel = styled.div`
  height: 100%;
  width: 100%;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 17px;
  background-color: rgba(247,247,247,1);
  padding: 20px 0px 20px 0px;
`;

const AssignedTo = styled.div`
  height: 30px;
  width: 234px;
  opacity: 1;
  flex-direction: row;
  display: flex;
  margin-top: 1px;
`;

const List = styled.div`
  height: 30px;
  width: 150px;
  border-radius: 15.5px;
  background-color: rgba(238,238,238,1);
  flex-direction: row;
  display: flex;
  margin-left: 7px;
`;

const AgentAvatarArea = styled.div`
  height: 20px;
  width: 20px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const AgentAvatarImage = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const AssignedToAgentName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  letter-spacing: -0.2387179487179489px;
  margin-left: 10px;
  margin-top: 2px;
`;

const AssignedAgentAvatarRow = styled.div`
  height: 20px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
  margin-right: 14px;
  margin-left: 15px;
  margin-top: 6px;
`;

const AssignedToAgentRow = styled.div`
  height: 30px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const ActionList = styled.div`
  height: 30px;
  width: 160px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: auto;
`;

const ResolvedSelector = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 30px;
  width: 160px;
  border-width: 2px;
  border-color: rgba(118,194,133,1);
  border-radius: 15.5px;
  background-color: transparent;
  flex-direction: column;
  display: flex;
  border-style: solid;
`;

const MarkAsResolved = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(62,158,81,1);
  font-size: 14px;
  margin-top: 6px;
  margin-left: 19px;
`;

const TriangleStack = styled.div`
  width: 160px;
  height: 30px;
  position: relative;
`;

const AssignedToRow = styled.div`
  height: 31px;
  flex-direction: row;
  display: flex;
  margin-left: 25px;
  margin-right: 15px;
`;

const MessageList = styled.div`
  position: absolute;
  top: 0px;
  left: 24px;
  height: 100%;
  width: 95%;
  opacity: 1;
  flex-direction: column;
  display: flex;
  overflow-y: "scroll";
  background-color: rgba(247,247,247,1);
`;

const MessageAgent = styled.div`
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 6px;
  text-align: right;
  margin-left: auto;
`;

const UserName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: right;
  color: rgba(85,85,85,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-left: 314px;
`;

const AgentMessageText = styled.span`
  font-family: Arial;
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 15px;
  opacity: 1;
  background-color: transparent;
  line-height: 18px;
  border-radius: 10px;
  color: rgba(255,255,255,1);
  background-color: rgba(99,135,237,1);
  font-size: 14px;
`;

const AgentTextAreaStack = styled.div`
  width: 371px;
  height: 69px;
  margin-top: 2px;
  position: relative;
`;

const AgentAvatarMessage = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
  margin-left: 10px;
`;

const AgenAvatarImage = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const AgentTextAreaStackRow = styled.div`
  height: 71px;
  flex-direction: row;
  display: flex;
  margin-top: 2px;
`;

const Message = styled.div`
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 6px;
`;

const SenderName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-left: 39px;
`;

const SenderImage = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 28px;
  width: 28px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const UserSenderImage = styled.div`
  height: 28px;
  width: 28px;
  border-radius: 8px;
  background-color: rgba(237,171,99,1);
  flex-direction: column;
  display: flex;
`;

const SenderInitial = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(255,255,255,1);
  font-size: 16px;
  letter-spacing: -0.2728205128205129px;
  margin: auto;
`;

const UserIconStack = styled.div`
  width: 32px;
  height: 30px;
  margin-top: 1px;
  position: relative;
`;

const ActiveUserMessage = styled.span`
  font-family: Arial;
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 15px;
  opacity: 1;
  background-color: transparent;
  line-height: 18px;
  color: rgba(85,85,85,1);
  font-size: 14px;
  border-radius: 10px;
  background-color: rgba(255,255,255,1);
`;

const UserTextAreaStack = styled.div`
  width: 371px;
  height: 69px;
  margin-left: 7px;
  position: relative;
`;

const UserMessageStackRow = styled.div`
  height: 69px;
  flex-direction: row;
  display: flex;
  margin-top: 3px;
`;

const MessageListStack = styled.div`
  width: 100%;
  min-height: 500px;
  margin-top: 19px;
  position: relative;
  background-color: rgba(247,247,247,1);
`;

const MessageInput = styled.div`
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin: 0px 24px 18px 24px;
`;

const TextArea = styled.div`
  position: absolute;
  top: 0px;
  left: 1px;
  height: 80px;
  width: 100%;
  border-radius: 10px;
  background-color: rgba(255,255,255,1);
  flex-direction: column;
  display: flex;
  padding-bottom: 10px;
`;


const Send = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(99,135,237,1);
  font-size: 12px;
`;

const SendPrivate = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(170,170,170,1);
  font-size: 12px;
  margin-left: 45px;
`;

const EditToolbar = styled.div`
  height: 16px;
  width: 121px;
  opacity: 1;
  flex-direction: row;
  display: flex;
  margin-left: auto;
`;

const AddMarkdown = styled.div`
  height: 15px;
  width: 13px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 23px;
`;

const PathMarkdownStack = styled.div`
  width: 13px;
  height: 15px;
  position: relative;
`;

const AddEmoji = styled.div`
  height: 16px;
  width: 16px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 22px;
`;

const PathEmojiStack = styled.div`
  width: 16px;
  height: 16px;
  position: relative;
`;

const AddCodeSnippet = styled.div`
  height: 14px;
  width: 17px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 23px;
  margin-top: 1px;
`;

const Path10Stack = styled.div`
  width: 17px;
  height: 14px;
  position: relative;
`;

const AddAttachmentsRow = styled.div`
  height: 16px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const SendRow = styled.div`
  height: 16px;
  flex-direction: row;
  display: flex;
  margin-left: 24px;
  margin-right: 24px;
`;

const TextAreaStack = styled.div`
  width: 100%;
  height: 91px;
  position: relative;
`;

const InfoPanel = styled.div`
  height: 100%;
  width: 308px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 11px;
`;

const RightBg = styled.div`
  height: 100%;
  width: 308px;
  background-color: rgba(255,255,255,1);
  flex-direction: column;
  display: flex;
`;

const User = styled.div`
  height: 217px;
  width: 189px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 25px;
  margin-left: 25px;
`;

const Info = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  letter-spacing: -0.2387179487179489px;
`;

const UserAvatar = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 32px;
  width: 32px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const UserImage = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 8px;
  background-color: rgba(237,171,99,1);
  flex-direction: column;
  display: flex;
`;

const UserInitial = styled.span`
  font-family: Arial;
  height: 20px;
  width: 9px;
  opacity: 1;
  background-color: transparent;
  color: rgba(255,255,255,1);
  font-size: 16px;
  letter-spacing: -0.2728205128205129px;
  margin-top: 6px;
  margin-left: 11px;
`;

const PresenceStack = styled.div`
  width: 36px;
  height: 34px;
  position: relative;
`;

const SelectedName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 15px;
  letter-spacing: -0.2557692307692309px;
  margin-left: 7px;
  margin-top: 7px;
`;

const PresenceStackRow = styled.div`
  height: 34px;
  flex-direction: row;
  display: flex;
  margin-top: 25px;
  margin-right: auto;
`;

const IconCompany = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const Oval3Stack = styled.div`
  width: 30px;
  height: 30px;
  position: relative;
`;

const CompanyName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  letter-spacing: -0.2387179487179489px;
  margin-left: 14px;
  margin-top: 5px;
`;

const IconCompanyRow = styled.div`
  height: 30px;
  flex-direction: row;
  display: flex;
  margin-top: 31px;
  margin-right: 56px;
`;

const IconEmail = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const OvalCopyStack = styled.div`
  width: 30px;
  height: 30px;
  position: relative;
`;

const Email = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  letter-spacing: -0.2387179487179489px;
  margin-left: 14px;
  margin-top: 5px;
`;

const IconEmailRow = styled.div`
  height: 30px;
  flex-direction: row;
  display: flex;
  margin-top: 10px;
  margin-right: -10px;
`;

const IconLocation = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const IconLocation1 = styled.div`
  position: absolute;
  top: 8px;
  left: 10px;
  height: 15px;
  width: 9px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const Path4Stack = styled.div`
  width: 9px;
  height: 15px;
  position: relative;
`;

const OvalCopy2Stack = styled.div`
  width: 30px;
  height: 30px;
  position: relative;
`;

const CompanyLocation = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  letter-spacing: -0.2387179487179489px;
  margin-left: 14px;
  margin-top: 5px;
`;

const IconLocationRow = styled.div`
  height: 30px;
  flex-direction: row;
  display: flex;
  margin-top: 10px;
  margin-right: 63px;
`;

const OtherUserInfo = styled.div`
  height: 106px;
  width: 262px;
  opacity: 1;
  flex-direction: row;
  display: flex;
  margin-top: 25px;
  margin-left: 26px;
`;

const PastVisits = styled.div`
  height: 106px;
  width: 84px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const Rectangle = styled.div`
  height: 106px;
  width: 84px;
  border-radius: 10px;
  background-color: rgba(229,104,98,0.1);
  flex-direction: column;
  display: flex;
`;

const Style = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(229,104,98,1);
  font-size: 18px;
  letter-spacing: -0.3069230769230771px;
  margin-top: 53px;
  margin-left: 13px;
`;

const PastVisits1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(229,104,98,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-top: 4px;
  margin-left: 13px;
`;

const PastChats = styled.div`
  height: 106px;
  width: 84px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 5px;
`;

const Rectangle1 = styled.div`
  height: 106px;
  width: 84px;
  border-radius: 10px;
  background-color: rgba(118,194,133,0.15);
  flex-direction: column;
  display: flex;
`;

const Style1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(93,171,108,1);
  font-size: 18px;
  letter-spacing: -0.3069230769230771px;
  margin-top: 53px;
  margin-left: 13px;
`;

const PastChats1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(93,171,108,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-top: 4px;
  margin-left: 13px;
`;

const TimeOnSite = styled.div`
  height: 106px;
  width: 84px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 5px;
`;

const Rectangle2 = styled.div`
  height: 106px;
  width: 84px;
  border-radius: 10px;
  background-color: rgba(245,200,2,0.15);
  flex-direction: column;
  display: flex;
`;

const M12S = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(251,152,1,1);
  font-size: 18px;
  letter-spacing: -0.3069230769230771px;
  margin-top: 53px;
  margin-left: 13px;
`;

const TimeOnSite1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(251,152,1,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-top: 4px;
  margin-left: 13px;
`;

const PastVisitsRow = styled.div`
  height: 106px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const Tickets = styled.div`
  height: 294px;
  width: 190px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 25px;
  margin-left: 25px;
`;

const Ticket3 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  letter-spacing: -0.2387179487179489px;
`;

const Ticket = styled.div`
  height: 77px;
  width: 165px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 14px;
`;

const Logo = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const IconTicket = styled.div`
  position: absolute;
  top: 9px;
  left: 7px;
  height: 12px;
  width: 16px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const PathStack = styled.div`
  width: 16px;
  height: 12px;
  position: relative;
`;

const OvalStack = styled.div`
  width: 30px;
  height: 30px;
  position: relative;
`;

const Id = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(99,135,237,1);
  font-size: 14px;
  margin-left: 1px;
`;

const Name = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  margin-top: 3px;
`;

const IdColumn = styled.div`
  width: 123px;
  flex-direction: column;
  display: flex;
  margin-left: 13px;
  margin-top: 4px;
`;

const LogoRow = styled.div`
  height: 41px;
  flex-direction: row;
  display: flex;
  margin-right: -1px;
`;

const Status = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 12px;
  margin-top: 3px;
  margin-left: 44px;
`;

const Created = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(155,155,155,1);
  font-size: 12px;
  margin-top: 3px;
  margin-left: 44px;
`;

const Ticket1 = styled.div`
  height: 80px;
  width: 165px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 13px;
`;

const Logo1 = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const IconTicket1 = styled.div`
  position: absolute;
  top: 9px;
  left: 7px;
  height: 12px;
  width: 16px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const Path1Stack = styled.div`
  width: 16px;
  height: 12px;
  position: relative;
`;

const Oval1Stack = styled.div`
  width: 30px;
  height: 30px;
  position: relative;
`;

const Id1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(99,135,237,1);
  font-size: 14px;
  margin-left: 1px;
`;

const Name1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  margin-top: 3px;
`;

const Id1Column = styled.div`
  width: 110px;
  flex-direction: column;
  display: flex;
  margin-left: 13px;
  margin-top: 7px;
`;

const Logo1Row = styled.div`
  height: 44px;
  flex-direction: row;
  display: flex;
  margin-right: 12px;
`;

const Status1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 12px;
  margin-top: 3px;
  margin-left: 44px;
`;

const Created1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(155,155,155,1);
  font-size: 12px;
  margin-top: 3px;
  margin-left: 44px;
`;

const Ticket2 = styled.div`
  height: 80px;
  width: 190px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 13px;
`;

const Logo2 = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const IconTicket2 = styled.div`
  position: absolute;
  top: 9px;
  left: 7px;
  height: 12px;
  width: 16px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const Path2Stack = styled.div`
  width: 16px;
  height: 12px;
  position: relative;
`;

const Oval2Stack = styled.div`
  width: 30px;
  height: 30px;
  position: relative;
`;

const Id2 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(99,135,237,1);
  font-size: 14px;
  margin-left: 1px;
`;

const Name2 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 14px;
  margin-top: 3px;
`;

const Id2Column = styled.div`
  width: 152px;
  flex-direction: column;
  display: flex;
  margin-left: 13px;
  margin-top: 7px;
`;

const Logo2Row = styled.div`
  height: 44px;
  flex-direction: row;
  display: flex;
  margin-right: -5px;
`;

const Status2 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(85,85,85,1);
  font-size: 12px;
  margin-top: 3px;
  margin-left: 44px;
`;

const Created2 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  color: rgba(155,155,155,1);
  font-size: 12px;
  margin-top: 3px;
  margin-left: 44px;
`;

const LeftMenuRow = styled.div`
  height: 100%;
  flex-direction: row;
  display: flex;
  flex: 1;
`
/* Styles */
 
export default App;