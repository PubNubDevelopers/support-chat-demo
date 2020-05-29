import React, { useCallback, useEffect, useState, useRef } from 'react';
import PubNub from 'pubnub';
import { PubNubProvider, usePubNub } from 'pubnub-react';
import styled from "styled-components";
import './App.css';
import 'emoji-mart/css/emoji-mart.css';
import { Picker } from 'emoji-mart';

let [myName, myInitials] = generateName();

console.log("Hello "+myInitials);
 
const pubnub = new PubNub({
  publishKey: 'pub-c-a4c4e92e-a605-4508-89f7-c37faf290e88',
  subscribeKey: 'sub-c-3035268e-a0fe-11ea-8e2f-c62edd1c297d',
  uuid: myName
});
const pChannel = 'supportChannel.';
const channel = pChannel+myName.replace(/\s/g, '');


console.log(channel);
  
const SupportClient = () => {
  const pubnub = usePubNub();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [show, toggleShow] = React.useState(false);
  const [emojiShow, toggleEmojiShow] = React.useState(false);
  const divRef = useRef(null);
 
  const sendMessage = useCallback(
    async message => {
      if (input) {
        await pubnub.publish({
                message: {sender:"client",name:myName,message:input},
                channel:channel
              });
        setInput('');
      }
    },
    [pubnub, setInput, input]
  );

  useEffect(() => {
    pubnub.addListener({
      message: messageEvent => {
        setMessages([...messages, messageEvent.message] as any);
        divRef.current.scrollIntoView({ behavior: 'smooth' });
      },
    });
    pubnub.subscribe({
        channels: [channel, pChannel+"*"],
        withPresence: true
    });

  }, [messages, pubnub, divRef]);

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
      <NewConversationsRow>
      {emojiShow && <EmojiSelector>
        <Picker 
          showPreview={false}
          showSkinTones={false}
          onSelect={e => {setInput(input+e.native);toggleEmojiShow(!emojiShow);}}
        />
      </EmojiSelector>}
        {show && <SelectedDirectChannel>
          <MessageBg>
            <AssignedToRow>
              <AssignedTo>
                <AssignedToNameGroup>
                  <AssignedToNameStack>
                    <AssignedToName>Phil</AssignedToName>
                    <svg
                      viewBox="-1.5 -1.5 16 16"
                      style={{
                        position: "absolute",
                        height: 16,
                        width: 16,
                        top: 0,
                        left: 16,
                        backgroundColor: "transparent",
                        borderColor: "transparent"
                      }}
                    >
                      <path
                        strokeWidth={3}
                        fill="rgba(126,211,33,1)"
                        stroke="rgba(78,111,199,1)"
                        fillOpacity={1}
                        strokeOpacity={1}
                        d="M6.50 11.50 C9.26 11.50 11.50 9.26 11.50 6.50 C11.50 3.74 9.26 1.50 6.50 1.50 C3.74 1.50 1.50 3.74 1.50 6.50 C1.50 9.26 3.74 11.50 6.50 11.50 Z"
                      ></path>
                    </svg>
                  </AssignedToNameStack>
                  <AssignedToImageColumn>
                    <AssignedToImage
                      src={require("./assets/images/8fb65c19677a1d8770ff89a500350d6b3aada798.png")}
                    ></AssignedToImage>
                  </AssignedToImageColumn>
                </AssignedToNameGroup>
              </AssignedTo>
              <ChannelColumn>
                <Channel>Customer Support Experts</Channel>
                <Status>The team typically replies in a few minutes.</Status>
              </ChannelColumn>
            </AssignedToRow>
            <MessageList  style={{overflow: "scroll"}}>
              {messages.map((message, messageIndex) => {
                if (message.sender === "agent") {
                  return (
                    <NewMessage key={`message-${messageIndex}`}>
                      <AgentName>Phil (Agent)</AgentName>
                      <AgentAvatarRow>
                        <AgentAvatar>
                          <AgentAvatarImg
                            src={require("./assets/images/8fb65c19677a1d8770ff89a500350d6b3aada798.png")}
                          ></AgentAvatarImg>
                        </AgentAvatar>
                        <AgentMessageAreaStack>
                           {message.message}
                        </AgentMessageAreaStack>
                      </AgentAvatarRow>
                    </NewMessage>
                  );
                } else {
                  return (
                    <NewMessage key={`message-${messageIndex}`}>
                      <ClientName>{myName} (You)</ClientName>
                      <AgentAvatarRow>
                        <ClientMessageAreaStack>
                           {message.message}
                        </ClientMessageAreaStack>
                      </AgentAvatarRow>
                    </NewMessage>
                  );
                }
              })}
              <div ref={divRef} />
            </MessageList>
              <MessageInputBG>
                <TextInputAreaRow>
                  <TextInputArea>
                    <InputRow>
                      <Input
                        type="text"
                        placeholder="Type your message"
                        value={input}
                        maxlength="250"
                        onChange={e => setInput(e.target.value)}
                      />
                      <AddEmoji onClick={() => {toggleEmojiShow(!emojiShow)}}>
                        <PathStack>
                          <svg
                            viewBox="0 0 12 12"
                            style={{
                              position: "absolute",
                              height: 12,
                              width: 12,
                              top: 0,
                              left: 0,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(27,27,27,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M11.37 6.00 C11.37 8.96 8.96 11.37 6.00 11.37 C3.04 11.37 0.63 8.96 0.63 6.00 C0.63 3.04 3.04 0.63 6.00 0.63 M10.24 10.24 C11.38 9.11 12.00 7.60 12.00 6.00 C12.00 4.40 11.38 2.89 10.24 1.76 C9.11 0.62 7.60 0.00 6.00 0.00 C4.40 0.00 2.89 0.62 1.76 1.76 C0.62 2.89 0.00 4.40 0.00 6.00 C0.00 7.60 0.62 9.11 1.76 10.24 C2.89 11.38 4.40 12.00 6.00 12.00 "
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 8.21 2.53"
                            style={{
                              position: "absolute",
                              height: 3,
                              width: 8,
                              top: 3,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(27,27,27,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M5.22 1.90 C5.22 1.90 5.05 1.49 5.05 1.26 C5.05 1.18 5.06 1.10 5.08 1.02 C5.08 1.01 5.08 1.01 5.08 1.01 C5.11 0.88 5.22 0.63 5.22 0.63 L7.41 0.63 C7.41 0.63 7.58 1.04 7.58 1.26 C7.58 1.49 7.41 1.90 7.41 1.90 Z M0.80 1.90 C0.80 1.90 0.63 1.49 0.63 1.26 C0.63 1.04 0.80 0.63 0.80 0.63 L2.99 0.63 C2.99 0.63 3.11 0.88 3.13 1.01 C3.13 1.01 3.13 1.01 3.13 1.02 C3.15 1.10 3.16 1.18 3.16 1.26 C3.16 1.49 2.99 1.90 2.99 1.90 Z M7.83 0.13 L7.58 0.00 L5.05 0.00 C5.05 0.00 4.86 0.05 4.80 0.13 C4.68 0.28 4.53 0.63 4.53 0.63 L3.68 0.63 C3.68 0.63 3.53 0.28 3.41 0.13 C3.35 0.05 3.16 0.00 3.16 0.00 L0.63 0.00 C0.63 0.00 0.44 0.05 0.38 0.13 C0.13 0.46 0.00 0.85 0.00 1.26 C0.00 1.68 0.13 2.07 0.38 2.40 C0.44 2.48 0.63 2.53 0.63 2.53 L3.16 2.53 C3.16 2.53 3.35 2.48 3.41 2.40 C3.66 2.07 3.79 1.26 3.79 1.26 L4.42 1.26 C4.42 1.26 4.55 2.07 4.80 2.40 C4.86 2.48 5.05 2.53 5.05 2.53 L7.58 2.53 C7.58 2.53 7.77 2.48 7.83 2.40 C8.08 2.07 8.21 1.68 8.21 1.27 C8.21 0.85 7.83 0.13 7.83 0.13 Z"
                            ></path>
                          </svg>
                          <svg
                            viewBox="0 0 6.26 3.79"
                            style={{
                              position: "absolute",
                              height: 4,
                              width: 6,
                              top: 6,
                              left: 2,
                              backgroundColor: "transparent",
                              borderColor: "transparent"
                            }}
                          >
                            <path
                              strokeWidth={0}
                              fill="rgba(27,27,27,1)"
                              fillOpacity={1}
                              strokeOpacity={1}
                              d="M4.05 3.79 C3.08 3.79 2.13 3.44 1.39 2.81 C0.66 2.18 0.16 1.31 0.00 0.37 C-0.02 0.20 0.09 0.03 0.26 0.00 C0.44 -0.02 0.60 0.09 0.63 0.26 C0.91 1.94 2.35 3.16 4.05 3.16 C4.66 3.16 5.26 3.00 5.79 2.69 C5.94 2.61 6.13 2.66 6.22 2.81 C6.31 2.96 6.26 3.15 6.11 3.24 C5.48 3.60 4.77 3.79 4.05 3.79 Z"
                            ></path>
                          </svg>
                        </PathStack>
                      </AddEmoji>
                    </InputRow>
                  </TextInputArea>
                  <Send onClick={e => {
                    e.preventDefault();
                    sendMessage(input);
                  }}>
                    <Rectangle>
                      <svg
                        viewBox="0 0 13.33 12"
                        style={{
                          height: 12,
                          width: 13,
                          backgroundColor: "transparent",
                          borderColor: "transparent",
                          margin:6
                        }}
                      >
                        <path
                          strokeWidth={0}
                          fill="rgba(255,255,255,1)"
                          fillOpacity={1}
                          strokeOpacity={1}
                          d="M9.50 11.04 L6.86 8.42 L12.21 1.83 L9.50 11.04 Z M4.67 7.16 L10.94 2.34 L6.15 8.24 L6.15 8.24 L4.67 10.06 Z M10.75 1.64 L4.27 6.63 L1.28 5.63 L10.75 1.64 Z M13.22 0.08 L13.22 0.08 L13.22 0.08 L13.22 0.08 Z M12.87 0.03 L0.20 5.36 C0.20 5.36 -0.01 5.54 0.00 5.68 C0.01 5.82 0.23 5.98 0.23 5.98 L4.00 7.24 L4.00 11.00 C4.00 11.00 4.09 11.27 4.22 11.31 C4.26 11.33 4.30 11.33 4.33 11.33 C4.43 11.33 4.59 11.21 4.59 11.21 L6.43 8.94 L9.43 11.90 C9.43 11.90 9.58 12.00 9.67 12.00 C9.69 12.00 9.72 12.00 9.75 11.99 C9.86 11.96 9.99 11.76 9.99 11.76 L13.32 0.43 L13.22 0.08 L12.87 0.03 Z"
                        ></path>
                      </svg>
                    </Rectangle>
                  </Send>
                </TextInputAreaRow>
              </MessageInputBG>
            </MessageBg>
          <CancelBtn>
            <OvalStack>
              <svg
                viewBox="0 0 36 36"
                style={{
                  position: "absolute",
                  height: 36,
                  width: 36,
                  top: 0,
                  left: 0,
                  backgroundColor: "transparent",
                  borderColor: "transparent"
                }}
              >
                <path
                  strokeWidth={0}
                  fill="rgba(89,122,213,1)"
                  fillOpacity={1}
                  strokeOpacity={1}
                  d="M18.00 36.00 C27.94 36.00 36.00 27.94 36.00 18.00 C36.00 8.06 27.94 0.00 18.00 0.00 C8.06 0.00 0.00 8.06 0.00 18.00 C0.00 27.94 8.06 36.00 18.00 36.00 Z"
                ></path>
              </svg>
              <svg
                viewBox="-1 -1 12 12"
                style={{
                  position: "absolute",
                  height: 12,
                  width: 12,
                  top: 13,
                  left: 13,
                  backgroundColor: "transparent",
                  borderColor: "transparent"
                }}
              >
                <path
                  strokeWidth={2}
                  fill="transparent"
                  stroke="rgba(0,0,0,1)"
                  fillOpacity={1}
                  strokeOpacity={1}
                  d="M1.32 8.71 L9.00 1.00 "
                ></path>
              </svg>
              <svg
                viewBox="-1 -1 12 12"
                style={{
                  position: "absolute",
                  height: 12,
                  width: 12,
                  top: 13,
                  left: 13,
                  backgroundColor: "transparent",
                  borderColor: "transparent",
                  transform: "rotate(undefined)"
                }}
              >
                <path
                  strokeWidth={2}
                  fill="transparent"
                  stroke="rgba(0,0,0,1)"
                  fillOpacity={1}
                  strokeOpacity={1}
                  d="M1.00 9.00 L9.00 1.00 "
                ></path>
              </svg>
            </OvalStack>
          </CancelBtn>
        </SelectedDirectChannel>}
        {!show && <NewConversations>
          <MessageBg1>
            <CompanyLogo>
              <Oval1Stack>
                <svg
                  viewBox="0 0 46 46"
                  style={{
                    position: "absolute",
                    height: 46,
                    width: 46,
                    top: 0,
                    left: 0,
                    backgroundColor: "transparent",
                    borderColor: "transparent"
                  }}
                >
                  <path
                    strokeWidth={0}
                    fill="rgba(255,102,83,1)"
                    fillOpacity={1}
                    strokeOpacity={1}
                    d="M23.00 46.00 C35.70 46.00 46.00 35.70 46.00 23.00 C46.00 10.30 35.70 0.00 23.00 0.00 C10.30 0.00 0.00 10.30 0.00 23.00 C0.00 35.70 10.30 46.00 23.00 46.00 Z"
                  ></path>
                </svg>
                <CompanyLogo1>
                  <Path3StackStack>
                    <Path3Stack>
                      <svg
                        viewBox="0 0 5 5"
                        style={{
                          position: "absolute",
                          height: 5,
                          width: 5,
                          top: 4,
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
                          d="M4.00 2.50 C4.00 3.33 3.33 4.00 2.50 4.00 C1.67 4.00 1.00 3.33 1.00 2.50 C1.00 1.67 1.67 1.00 2.50 1.00 M5.00 2.50 C5.00 1.12 3.88 0.00 2.50 0.00 C1.12 0.00 0.00 1.12 0.00 2.50 C0.00 3.88 1.12 5.00 2.50 5.00 "
                        ></path>
                      </svg>
                      <svg
                        viewBox="0 0 19 19"
                        style={{
                          position: "absolute",
                          height: 19,
                          width: 19,
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
                          d="M14.04 10.75 C14.04 10.75 9.81 13.00 9.50 13.00 C9.50 13.00 9.29 13.00 8.74 12.61 C8.36 12.34 7.91 11.95 7.48 11.52 C7.05 11.10 6.66 10.65 6.39 10.26 C6.00 9.71 6.00 9.50 6.00 9.50 C6.00 9.19 6.42 7.04 8.25 4.96 C10.45 2.47 13.81 1.11 18.00 1.01 C17.89 5.20 14.04 10.75 14.04 10.75 L14.04 10.75 Z M9.19 16.89 C9.19 16.89 9.19 16.89 9.19 16.89 C9.19 16.89 9.19 16.89 9.19 16.89 Z M9.99 13.95 C10.65 13.83 11.69 13.49 12.83 12.84 C12.30 14.45 9.30 16.81 9.19 16.89 C9.22 16.82 9.92 15.08 9.99 13.95 Z M2.11 9.81 C3.06 8.43 4.52 6.71 6.16 6.17 C5.51 7.31 5.17 8.35 5.05 9.02 C3.90 9.09 2.90 9.42 2.11 9.81 Z M18.50 0.00 C18.50 0.00 13.59 0.44 11.63 1.31 C10.00 2.02 8.62 3.03 7.50 4.29 C7.29 4.53 7.10 4.77 6.92 5.01 C6.06 5.07 5.18 5.41 4.30 6.03 C3.55 6.55 2.80 7.28 2.07 8.19 C0.84 9.71 0.08 11.21 0.05 11.28 C-0.06 11.50 0.01 11.76 0.21 11.90 C0.29 11.97 0.40 12.00 0.50 12.00 C0.63 12.00 0.76 11.95 0.85 11.86 C0.86 11.85 1.34 11.38 2.15 10.92 C2.82 10.54 3.86 10.09 5.11 10.01 C5.43 10.82 6.34 11.79 6.77 12.23 C7.21 12.66 8.18 13.57 8.99 13.89 C8.91 15.14 8.46 16.18 8.08 16.85 C7.62 17.66 7.15 18.14 7.15 18.15 C6.97 18.32 6.95 18.59 7.09 18.79 C7.19 18.93 7.34 19.00 7.50 19.00 C7.58 19.00 7.65 18.98 7.72 18.95 C7.79 18.91 9.29 18.16 10.81 16.93 C11.72 16.20 12.45 15.45 12.97 14.70 C13.59 13.82 13.93 12.94 13.99 12.08 C14.23 11.90 14.47 11.71 14.71 11.50 C15.97 10.38 16.97 8.99 17.69 7.37 C18.56 5.41 19.00 0.50 19.00 0.50 L19.00 0.00 L18.50 0.00 L18.50 0.00 Z"
                        ></path>
                      </svg>
                    </Path3Stack>
                    <svg
                      viewBox="0 0 7.05 7.05"
                      style={{
                        position: "absolute",
                        height: 7,
                        width: 7,
                        top: 13,
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
                        d="M4.84 1.00 C4.84 1.00 5.38 1.13 5.65 1.40 C5.98 1.73 6.10 2.06 6.03 2.41 C5.95 2.76 5.63 3.32 4.57 4.06 C3.77 4.60 2.70 5.14 1.37 5.68 C1.96 4.21 2.56 3.06 3.15 2.25 C3.76 1.43 4.84 1.00 4.84 1.00 L4.84 1.00 Z M0.50 7.05 C0.50 7.05 0.62 7.04 0.67 7.02 C4.54 5.61 6.67 4.13 7.00 2.63 C7.11 2.15 7.08 1.42 6.35 0.69 C5.89 0.23 5.38 0.00 4.84 0.00 C3.19 0.00 1.57 2.14 0.03 6.38 C-0.04 6.56 0.01 6.76 0.15 6.90 C0.24 7.00 0.50 7.05 0.50 7.05 Z"
                      ></path>
                    </svg>
                  </Path3StackStack>
                </CompanyLogo1>
              </Oval1Stack>
            </CompanyLogo>
            <Text1>Got a question?</Text1>
            <Text2>We would love to help you!</Text2>
            <MessageListBg1>
              <MessageListBg2>
                <Text>
                  Our team of experts is ready to help with your queries!
                </Text>
                <Users>
                  <UserRow>
                    <User>
                      <AgentAvatarImageStack>
                        <UserAvatarImage1>
                          <UserAvatarImage
                            src={require("./assets/images/99e27ff5381f87feb308e505e13e0a5384b45316.png")}
                          ></UserAvatarImage>
                        </UserAvatarImage1>
                        <svg
                          viewBox="-1.5 -1.5 16 16"
                          style={{
                            position: "absolute",
                            height: 16,
                            width: 16,
                            top: 29,
                            left: 28,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={3}
                            fill="rgba(126,211,33,1)"
                            stroke="rgba(181,194,229,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M6.50 11.50 C9.26 11.50 11.50 9.26 11.50 6.50 C11.50 3.74 9.26 1.50 6.50 1.50 C3.74 1.50 1.50 3.74 1.50 6.50 C1.50 9.26 3.74 11.50 6.50 11.50 Z"
                          ></path>
                        </svg>
                      </AgentAvatarImageStack>
                    </User>
                    <User2>
                      <UserAvatarImage2Stack>
                        <UserAvatarImage5>
                          <UserAvatarImage4
                            src={require("./assets/images/ead465ad39218a5b3b6f9b43bb17da6f0c066b31.png")}
                          ></UserAvatarImage4>
                        </UserAvatarImage5>
                        <svg
                          viewBox="-1.5 -1.5 16 16"
                          style={{
                            position: "absolute",
                            height: 16,
                            width: 16,
                            top: 29,
                            left: 27,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={3}
                            fill="rgba(126,211,33,1)"
                            stroke="rgba(181,194,229,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M6.50 11.50 C9.26 11.50 11.50 9.26 11.50 6.50 C11.50 3.74 9.26 1.50 6.50 1.50 C3.74 1.50 1.50 3.74 1.50 6.50 C1.50 9.26 3.74 11.50 6.50 11.50 Z"
                          ></path>
                        </svg>
                      </UserAvatarImage2Stack>
                    </User2>
                    <User1>
                      <UserAvatarImage3Stack>
                        <UserAvatarImage3>
                          <UserAvatarImage2
                            src={require("./assets/images/8fb65c19677a1d8770ff89a500350d6b3aada798.png")}
                          ></UserAvatarImage2>
                        </UserAvatarImage3>
                        <svg
                          viewBox="-1.5 -1.5 16 16"
                          style={{
                            position: "absolute",
                            height: 16,
                            width: 16,
                            top: 29,
                            left: 29,
                            backgroundColor: "transparent",
                            borderColor: "transparent"
                          }}
                        >
                          <path
                            strokeWidth={3}
                            fill="rgba(126,211,33,1)"
                            stroke="rgba(181,194,229,1)"
                            fillOpacity={1}
                            strokeOpacity={1}
                            d="M6.50 11.50 C9.26 11.50 11.50 9.26 11.50 6.50 C11.50 3.74 9.26 1.50 6.50 1.50 C3.74 1.50 1.50 3.74 1.50 6.50 C1.50 9.26 3.74 11.50 6.50 11.50 Z"
                          ></path>
                        </svg>
                      </UserAvatarImage3Stack>
                    </User1>
                  </UserRow>
                </Users>
                <NewConversation onClick={() => {toggleShow(!show);setMessages([...messages, {sender:"agent",name:"agent",message:"You're connected to an agent. What can I help you with today?"}]);}}>
                  <Bg>
                    <NewConversationLabel>New Conversation</NewConversationLabel>
                  </Bg>
                </NewConversation>
              </MessageListBg2>
            </MessageListBg1>
          </MessageBg1>
          <CancelBtn1>
            <Oval2Stack>
              <svg
                viewBox="0 0 36 36"
                style={{
                  position: "absolute",
                  height: 36,
                  width: 36,
                  top: 0,
                  left: 0,
                  backgroundColor: "transparent",
                  borderColor: "transparent"
                }}
              >
                <path
                  strokeWidth={0}
                  fill="rgba(89,122,213,1)"
                  fillOpacity={1}
                  strokeOpacity={1}
                  d="M18.00 36.00 C27.94 36.00 36.00 27.94 36.00 18.00 C36.00 8.06 27.94 0.00 18.00 0.00 C8.06 0.00 0.00 8.06 0.00 18.00 C0.00 27.94 8.06 36.00 18.00 36.00 Z"
                ></path>
              </svg>
              <svg
                viewBox="-1 -1 12 12"
                style={{
                  position: "absolute",
                  height: 12,
                  width: 12,
                  top: 13,
                  left: 13,
                  backgroundColor: "transparent",
                  borderColor: "transparent"
                }}
              >
                <path
                  strokeWidth={2}
                  fill="transparent"
                  stroke="rgba(0,0,0,1)"
                  fillOpacity={1}
                  strokeOpacity={1}
                  d="M1.32 8.71 L9.00 1.00 "
                ></path>
              </svg>
              <svg
                viewBox="-1 -1 12 12"
                style={{
                  position: "absolute",
                  height: 12,
                  width: 12,
                  top: 13,
                  left: 13,
                  backgroundColor: "transparent",
                  borderColor: "transparent",
                  transform: "rotate(undefined)"
                }}
              >
                <path
                  strokeWidth={2}
                  fill="transparent"
                  stroke="rgba(0,0,0,1)"
                  fillOpacity={1}
                  strokeOpacity={1}
                  d="M1.00 9.00 L9.00 1.00 "
                ></path>
              </svg>
            </Oval2Stack>
          </CancelBtn1>
        </NewConversations>}
      </NewConversationsRow>
    </Container>
  );
};
 
const App = () => {
  return (
    <PubNubProvider client={pubnub}>
      <SupportClient />
    </PubNubProvider>
  );
};

function capFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function generateName(){
  var name1 = ["adaptable", "adventurous", "affable", "affectionate", "agreeable", "ambitious", "amiable", "amicable", "amusing", "brave", "bright", "calm", "careful", "charming", "communicative", "compassionate", "considerate", "convivial", "courageous", "courteous", "creative", "decisive", "determined", "diligent", "diplomatic", "discreet", "dynamic", "easygoing", "emotional", "energetic", "enthusiastic", "exuberant", "faithful", "fearless", "forceful", "frank", "friendly", "funny", "generous", "gentle", "good", "gregarious", "helpful", "honest", "humorous", "imaginative", "impartial", "independent", "intellectual", "intelligent", "intuitive", "inventive", "kind", "loving", "loyal", "modest", "neat", "nice", "optimistic", "passionate", "patient", "persistent", "pioneering", "polite", "powerful", "practical", "reliable", "reserved", "resourceful", "romantic", "sensible", "sincere", "sociable", "sympathetic", "thoughtful", "tidy", "tough", "unassuming", "understanding", "versatile", "warmhearted", "willing", "witty"];
  var name2 = ["alligator", "ant", "bear", "bee", "bird", "camel", "cat", "cheetah", "chicken", "chimpanzee", "cow", "crocodile", "deer", "dog", "dolphin", "duck", "eagle", "elephant", "fish", "fly", "fox", "frog", "giraffe", "goat", "goldfish", "hamster", "hippopotamus", "horse", "kangaroo", "kitten", "lion", "lobster", "monkey", "octopus", "owl", "panda", "pig", "puppy", "rabbit", "rat", "scorpion", "seal", "shark", "sheep", "snail", "snake", "spider", "squirrel", "tiger", "turtle", "wolf", "zebra"];
  var first = capFirst(name1[getRandomInt(1, name1.length)]);
  var last = capFirst(name2[getRandomInt(1, name2.length)]);
  return [(first + ' ' + last), (first.charAt(0)+last.charAt(0))];
}

/* Styles */

const NewConversationsRow = styled.div`
  height: 609px;
  flex-direction: row;
  alignItems: flex-end;
  display: flex;
  flex: 1 1 0%;
  margin-right: 47px;
  margin-left: 1040px;
  margin-top: 81px;
`;

const UserAvatarImage1 = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 38px;
  width: 38px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const UserAvatarImage = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const AgentAvatarImageStack = styled.div`
  width: 44px;
  height: 45px;
  position: relative;
`;

const UserAvatarImage5 = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 38px;
  width: 38px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const UserAvatarImage4 = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const UserAvatarImage2Stack = styled.div`
  width: 43px;
  height: 45px;
  position: relative;
`;

const UserAvatarImage3 = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 38px;
  width: 38px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const UserAvatarImage2 = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const UserAvatarImage3Stack = styled.div`
  width: 45px;
  height: 45px;
  position: relative;
`;

const NewConversationLabel = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 12px;
  margin-top: 7px;
`;

const MessageList = styled.div`
  height: 410px;
  width: 252px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 15px;
  margin-left: 14px;
  background-color: rgba(255,255,255,0.6);
  overflow: "scroll";
`;

const PathStack = styled.div`
  width: 12px;
  height: 12px;
  position: relative;
`;

const AgentAvatar = styled.div`
  height: 30px;
  width: 30px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const AgentAvatarImg = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const NewMessage = styled.div`
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin: 10px 15px 15px 5px;
`;

const EmojiSelector = styled.div`
  position: absolute;
  z-index:99;
  right: 150;
  bottom: 2;
`;
//* Styles */


/* Light style */ //*
const Container = styled.div`
  display: flex;
  background-color: rgba(247,247,247,1);
  flex-direction: row;
  height: 100vh;
  width: 100vw;
`;

const NewConversations = styled.div`
  height: 427px;
  width: 280px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 182px;
`;

const MessageBg1 = styled.div`
  height: 376px;
  width: 280px;
  border-radius: 10px;
  background-color: rgba(99,135,237,0.8);
  flex-direction: column;
  display: flex;
`;

const CompanyLogo = styled.div`
  height: 46px;
  width: 46px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 24px;
  margin-left: 116px;
`;

const CompanyLogo1 = styled.div`
  position: absolute;
  top: 13px;
  left: 14px;
  height: 20px;
  width: 20px;
  opacity: 0.9321103050595237;
  flex-direction: column;
  display: flex;
`;

const Path3Stack = styled.div`
  top: 0px;
  left: 1px;
  width: 19px;
  height: 19px;
  position: absolute;
`;

const Path3StackStack = styled.div`
  width: 20px;
  height: 20px;
  position: relative;
`;

const Oval1Stack = styled.div`
  width: 46px;
  height: 46px;
  position: relative;
`;

const Text1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 14px;
  margin-top: 10px;
`;

const Text2 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 14px;
  margin-top: 1px;
`;

const MessageListBg1 = styled.div`
  height: 226px;
  width: 252px;
  background-color: rgba(255,255,255,0.3);
  flex-direction: column;
  display: flex;
  margin-top: 19px;
  margin-left: 14px;
`;

const MessageListBg2 = styled.div`
  height: 210px;
  width: 252px;
  transform: [
      {
      scaleX: -1,
      
    },
      
    ];
  background-color: rgba(255,255,255,0.4);
  flex-direction: column;
  display: flex;
  margin-top: 16px;
`;

const Text = styled.span`
  font-family: Arial;
  height: 39px;
  width: 172px;
  opacity: 1;
  background-color: transparent;
  line-height: 16px;
  text-align: center;
  color: rgba(51,51,51,1);
  font-size: 12px;
  margin-top: 38px;
  margin-left: 40px;
`;

const Users = styled.div`
  height: 40px;
  width: 142px;
  opacity: 1;
  flex-direction: row;
  display: flex;
  margin-top: 10px;
  margin-left: 55px;
`;

const User = styled.div`
  height: 40px;
  width: 39px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const User2 = styled.div`
  height: 40px;
  width: 38px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 12px;
`;

const User1 = styled.div`
  height: 40px;
  width: 40px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 13px;
`;

const UserRow = styled.div`
  height: 40px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const NewConversation = styled.div`
  height: 28px;
  width: 143px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 23px;
  margin-left: 54px;
  cursor: pointer;
`;

const Bg = styled.div`
  height: 28px;
  width: 143px;
  border-radius: 7px;
  background-color: rgba(89,122,213,1);
  flex-direction: column;
  display: flex;
`;

const CancelBtn1 = styled.div`
  height: 36px;
  width: 36px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 15px;
  margin-left: 244px;
`;

const Oval2Stack = styled.div`
  width: 36px;
  height: 36px;
  position: relative;
`;

const SelectedDirectChannel = styled.div`
  height: 600px;
  width: 280px;
  opacity: 1;
  flex-direction: column;
  margin-left: 33px;
  display: flex;
`;

const MessageBg = styled.div`
  height: 559px;
  width: 280px;
  border-radius: 10px;
  background-color: rgba(99,135,237,0.7);
  flex-direction: column;
  display: flex;
`;

const AssignedTo = styled.div`
  height: 57px;
  width: 38px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const AssignedToName = styled.span`
  font-family: Arial;
  position: absolute;
  top: 13px;
  left: 0px;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 12px;
`;

const AssignedToNameStack = styled.div`
  top: 29px;
  left: 11px;
  width: 32px;
  height: 28px;
  position: absolute;
`;

const AssignedToImageColumn = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 38px;
  width: 38px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const AssignedToImage = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const AssignedToNameGroup = styled.div`
  width: 43px;
  height: 57px;
  position: relative;
`;

const Channel = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 14px;
`;

const Status = styled.span`
  font-family: Arial;
  height: 30px;
  width: 162px;
  opacity: 1;
  background-color: transparent;
  color: rgba(255,255,255,1);
  font-size: 12px;
  margin-top: 5px;
  margin-left: 1px;
`;

const ChannelColumn = styled.div`
  width: 172px;
  flex-direction: column;
  display: flex;
  margin-left: 18px;
  margin-bottom: 5px;
`;

const AssignedToRow = styled.div`
  height: 57px;
  flex-direction: row;
  display: flex;
  margin-top: 24px;
  margin-left: 28px;
  margin-right: 24px;
`;

const AgentName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: left;
  color: rgba(85,85,85,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-right: 10px;
`;

const ClientName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: right;
  color: rgba(85,85,85,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-left: 10px;
`;

const AgentMessageAreaStack = styled.div`
  padding: 10px;
  margin-left: 6px;
  position: relative;
  border-radius: 10px;
  background-color: rgba(255,255,255,1);
  font-family: Arial;
  line-height: 16px;
  font-size: 13px;
`;

const AgentAvatarRow = styled.div`
  flex-direction: row;
  display: flex;
  margin-top: 1px;
`;

const ClientMessageAreaStack = styled.div`
  padding: 10px;
  margin-left: auto;
  position: relative;
  border-radius: 10px;
  background-color: rgba(89,122,213,1);
  color: rgba(255,255,255,1);
  font-family: Arial;
  line-height: 16px;
  font-size: 13px;
`;

const MessageInputBG = styled.div`
  height: 35px;
  width: 252px;
  opacity: 1;
  background-color: rgba(255,255,255,0.6);
  flex-direction: row;
  display: flex;
  margin-left: 14px;
`;

const TextInputArea = styled.div`
  height: 24px;
  width: 190px;
  border-radius: 9px;
  background-color: rgba(0,0,0,0.06999999999999999);
  flex-direction: row;
  display: flex;
  margin-left: 10px;
`;

const AddEmoji = styled.div`
  height: 12px;
  width: 12px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 10px;
  margin-top: 2px;
`;

const InputRow = styled.div`
  height: 17px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
  margin-right: 8px;
  margin-left: 8px;
  margin-top: 4px;
`;

const Input = styled.input`
  height: 17px;
  width: 145px;
  border-radius: 0px;
  border: 0px;
  line-height: 17px;
  background-color: transparent;
  font-family: Arial;
  font-size: 10px;
`;

const Send = styled.div`
  height: 24px;
  width: 28px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 10px;
  cursor: pointer;
`;

const Rectangle = styled.div`
  height: 24px;
  width: 28px;
  border-radius: 9px;
  background-color: rgba(89,122,213,1);
  flex-direction: column;
  display: flex;
`;

const TextInputAreaRow = styled.div`
  height: 24px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const CancelBtn = styled.div`
  height: 36px;
  width: 36px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 14px;
  margin-left: 244px;
`;

const OvalStack = styled.div`
  width: 36px;
  height: 36px;
  position: relative;
`;
//* Light Style */

/* Dark Style */ /*
const Container = styled.div`
  display: flex;
  background-color: rgba(247,247,247,1);
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;

const DesktopBg = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 721px;
  width: 1281px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const DesktopBg1 = styled.img`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 720px;
  width: 1280px;
  opacity: 1;
  background-color: transparent;
  object-fit: cover;
`;

const Gradient = styled.div`
  position: absolute;
  top: 1px;
  left: 641px;
  height: 720px;
  width: 640px;
  background-image: radial-gradient(circle at 71% 48%,rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 119%);
`;

const DesktopBg1Stack = styled.div`
  width: 1281px;
  height: 721px;
  position: relative;
`;

const SelectedDirectChannel = styled.div`
  position: absolute;
  top: 82px;
  left: 953px;
  height: 609px;
  width: 280px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const MessageBg = styled.div`
  height: 559px;
  width: 280px;
  border-radius: 10px;
  background-color: rgba(0,0,0,0.7);
  flex-direction: column;
  display: flex;
`;

const AssignedTo = styled.div`
  height: 57px;
  width: 38px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const AssignedToName = styled.span`
  font-family: Arial;
  position: absolute;
  top: 13px;
  left: 0px;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 12px;
`;

const AssignedToNameStack = styled.div`
  top: 29px;
  left: 11px;
  width: 32px;
  height: 28px;
  position: absolute;
`;

const AssignedToImageColumn = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 38px;
  width: 38px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const AssignedToImage = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const AssignedToNameGroup = styled.div`
  width: 43px;
  height: 57px;
  position: relative;
`;

const Channel = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 14px;
`;

const Status = styled.span`
  font-family: Arial;
  height: 30px;
  width: 162px;
  opacity: 1;
  background-color: transparent;
  color: rgba(255,255,255,1);
  font-size: 12px;
  margin-top: 5px;
  margin-left: 1px;
`;

const ChannelColumn = styled.div`
  width: 172px;
  flex-direction: column;
  display: flex;
  margin-left: 18px;
  margin-bottom: 5px;
`;

const AssignedToRow = styled.div`
  height: 57px;
  flex-direction: row;
  display: flex;
  margin-top: 24px;
  margin-left: 28px;
  margin-right: 24px;
`;

const AgentName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: right;
  color: rgba(255,255,255,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-right: 10px;
`;

const ClientName = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: left;
  color: rgba(255,255,255,1);
  font-size: 12px;
  letter-spacing: -0.2046153846153847px;
  margin-left: 10px;
`;

const AgentMessageAreaStack = styled.div`
  padding: 10px;
  margin-left: 6px;
  position: relative;
  opacity: 1;
  border-radius: 10px;
  background-color: rgba(255,255,255,0.16);
`;

const AgentAvatarRow = styled.div`
  flex-direction: row;
  display: flex;
  margin-top: 1px;
`;

const ClientMessageAreaStack = styled.div`
  padding: 10px;
  margin-left: 6px;
  position: relative;
  border-radius: 10px;
  background-color: rgba(0,15,255,1);
  color: rgba(255,255,255,1);
  font-family: Arial;
  line-height: 16px;
  font-size: 13px;
`;

const ReceiptRead1Stack = styled.div`
  width: 15px;
  height: 8px;
  margin-top: 2px;
  margin-left: 175px;
  position: relative;
`;

const ReceiptDeliveredStack = styled.div`
  width: 15px;
  height: 8px;
  margin-top: 13px;
  position: relative;
`;

const Message1Row = styled.div`
  height: 21px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
  margin-right: 5px;
  margin-left: 16px;
  margin-top: 8px;
`;

const MessageInputBG = styled.div`
  height: 24px;
  width: 231px;
  opacity: 1;
  flex-direction: row;
  display: flex;
  margin-top: 13px;
  margin-left: 9px;
`;

const TextInputArea = styled.div`
  height: 24px;
  width: 190px;
  border-radius: 9px;
  background-color: rgba(255,255,255,0.1);
  flex-direction: row;
  display: flex;
  margin-left: 10px;
`;

const AddEmoji = styled.div`
  height: 12px;
  width: 12px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 10px;
  margin-top: 2px;
`;

const Path1Stack = styled.div`
  width: 12px;
  height: 12px;
  position: relative;
`;

const InputRow = styled.div`
  height: 17px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
  margin-right: 8px;
  margin-left: 8px;
  margin-top: 4px;
`;

const Send = styled.div`
  height: 24px;
  width: 28px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 10px;
  cursor: pointer;
`;

const Rectangle = styled.div`
  height: 24px;
  width: 28px;
  border-radius: 9px;
  background-color: rgba(0,15,255,1);
  flex-direction: column;
  display: flex;
`;

const TextInputAreaRow = styled.div`
  height: 24px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const CancelBtn = styled.div`
  height: 36px;
  width: 36px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 14px;
  margin-left: 244px;
`;

const OvalStack = styled.div`
  width: 36px;
  height: 36px;
  position: relative;
`;

const NewConversations = styled.div`
  position: absolute;
  top: 264px;
  left: 641px;
  height: 427px;
  width: 280px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const MessageBg1 = styled.div`
  height: 376px;
  width: 280px;
  border-radius: 10px;
  background-color: rgba(0,0,0,0.7);
  flex-direction: column;
  display: flex;
`;

const CompanyLogo = styled.div`
  height: 46px;
  width: 46px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 24px;
  margin-left: 116px;
`;

const CompanyLogo1 = styled.div`
  position: absolute;
  top: 13px;
  left: 14px;
  height: 20px;
  width: 20px;
  opacity: 0.9321103050595237;
  flex-direction: column;
  display: flex;
`;

const Path3Stack = styled.div`
  top: 0px;
  left: 1px;
  width: 19px;
  height: 19px;
  position: absolute;
`;

const Path3StackStack = styled.div`
  width: 20px;
  height: 20px;
  position: relative;
`;

const Oval1Stack = styled.div`
  width: 46px;
  height: 46px;
  position: relative;
`;

const Text1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 14px;
  margin-top: 10px;
  margin-left: 92px;
`;

const Text2 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 14px;
  margin-top: 1px;
  margin-left: 57px;
`;

const MessageListBg1 = styled.div`
  height: 226px;
  width: 252px;
  background-color: rgba(255,255,255,0.1);
  flex-direction: column;
  display: flex;
  margin-top: 19px;
  margin-left: 14px;
`;

const MessageListBg2 = styled.div`
  height: 210px;
  width: 252px;
  transform: [
      {
      scaleX: -1,
      
    },
      
    ];
  background-color: rgba(255,255,255,0.1);
  flex-direction: column;
  display: flex;
  margin-top: 16px;
`;

const Text = styled.span`
  font-family: Arial;
  height: 39px;
  width: 172px;
  opacity: 1;
  background-color: transparent;
  line-height: 16px;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 12px;
  margin-top: 38px;
  margin-left: 40px;
`;

const Users = styled.div`
  height: 40px;
  width: 142px;
  opacity: 1;
  flex-direction: row;
  display: flex;
  margin-top: 10px;
  margin-left: 55px;
`;

const User = styled.div`
  height: 40px;
  width: 39px;
  opacity: 1;
  flex-direction: column;
  display: flex;
`;

const UserAvatar5 = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 38px;
  width: 38px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const UserAvatar4 = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const UserAvatar5Stack = styled.div`
  width: 44px;
  height: 45px;
  position: relative;
`;

const User1 = styled.div`
  height: 40px;
  width: 38px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 12px;
`;

const UserAvatar7 = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 38px;
  width: 38px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const UserAvatar6 = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const UserAvatar7Stack = styled.div`
  width: 43px;
  height: 45px;
  position: relative;
`;

const User2 = styled.div`
  height: 40px;
  width: 40px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-left: 13px;
`;

const UserAvatar9 = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 38px;
  width: 38px;
  opacity: 1;
  background-color: transparent;
  flex-direction: column;
  display: flex;
`;

const UserAvatar8 = styled.img`
  opacity: 1;
  background-color: transparent;
  flex: 1 1 0%;
  height: 100%;
  object-fit: cover;
  display: flex;
  flex-direction: column;
`;

const UserAvatar9Stack = styled.div`
  width: 45px;
  height: 45px;
  position: relative;
`;

const UserRow = styled.div`
  height: 40px;
  flex-direction: row;
  display: flex;
  flex: 1 1 0%;
`;

const NewConversation = styled.div`
  height: 28px;
  width: 143px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 23px;
  margin-left: 54px;
  cursor: pointer;
`;

const Bg = styled.div`
  height: 28px;
  width: 143px;
  border-radius: 7px;
  background-color: rgba(0,15,255,1);
  flex-direction: column;
  display: flex;
`;

const NewConversation1 = styled.span`
  font-family: Arial;
  opacity: 1;
  background-color: transparent;
  text-align: center;
  color: rgba(255,255,255,1);
  font-size: 12px;
  margin-top: 7px;
  margin-left: 23px;
`;

const CancelBtn1 = styled.div`
  height: 36px;
  width: 36px;
  opacity: 1;
  flex-direction: column;
  display: flex;
  margin-top: 15px;
  margin-left: 244px;
`;

const Oval2Stack = styled.div`
  width: 36px;
  height: 36px;
  position: relative;
`;

const DesktopBgStack = styled.div`
  width: 1281px;
  height: 721px;
  margin-top: -1px;
  position: relative;
`;
//* Dark Style */
 
export default App;