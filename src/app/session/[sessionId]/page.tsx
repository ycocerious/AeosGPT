"use client";

import {
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  MessageModel,
  Sidebar,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CreateSessionForm from "./create-session-form";
import { Team } from "@/types/team";
import { ChatSession } from "@/types/chat-session";
import { Conversation } from "@/types/conversation";

const ChatSessionFunction = () => {
  const [visible, setVisible] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [typing, setTyping] = useState(false);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(() => {
    const storedTeam = localStorage.getItem("selectedTeam");
    return storedTeam ? JSON.parse(storedTeam) : null;
  });
  const [chatSessions, setChatSessions] = useState<ChatSession[] | null>(null);
  const [selectedChatSession, setSelectedChatSession] =
    useState<ChatSession | null>(() => {
      const storedSession = localStorage.getItem("selectedChatSession");
      return storedSession ? JSON.parse(storedSession) : null;
    });
  const [messages, setMessages] = useState<MessageModel[] | null>(null);

  const handleTeamChange = (team: Team) => {
    setSelectedTeam(team);
    localStorage.setItem("selectedTeam", JSON.stringify(team));
  };
  const handleSessionChange = (session: ChatSession) => {
    setSelectedChatSession(session);
    localStorage.setItem("selectedChatSession", JSON.stringify(session));
  };

  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    if (user) {
      getTeamsOfUser();
    }
  }, [user]);

  const getTeamsOfUser = async () => {
    axios
      .get("/api/get-teams")
      .then((res) => {
        setTeams(res.data.teams);
      })
      .catch(() => {
        toast.error("Something went wrong!");
      });
  };

  useEffect(() => {
    if (selectedTeam) {
      getSessionsOfTeam(selectedTeam.teamId);
    }
  }, [selectedTeam]);

  const getSessionsOfTeam = async (teamId: number) => {
    axios
      .get(`/api/get-sessions/${teamId}`)
      .then((res) => {
        setChatSessions(res.data.sessions);
      })
      .catch(() => {
        toast.error("Something went wrong!");
      });
  };

  useEffect(() => {
    if (selectedChatSession) {
      getConversationsOfSession(selectedChatSession.id);
    }
  }, [selectedChatSession]);

  const getConversationsOfSession = async (sessionId: number) => {
    axios
      .get(`/api/get-conversations/${sessionId}`)
      .then((res) => {
        const conversations: Conversation[] = res.data.conversations;
        const messageModels: MessageModel[] = conversations.flatMap(
          (conversation, index) => [
            {
              message: conversation.user_prompt,
              sender: "User",
              direction: "outgoing" as const,
              position: 0,
            },
            {
              message: conversation.generated_result,
              sender: "Aeos",
              direction: "incoming" as const,
              position: 0,
            },
          ]
        );
        setMessages(messageModels);
      })
      .catch(() => {
        toast.error("Something went wrong!");
      });
  };

  const getAiResponse = async (message: string) => {
    setTyping(true)
    axios
      .get(`/api/get-ai-response/${selectedChatSession?.id}/${message}`)
      .then((res) => {
        getConversationsOfSession(selectedChatSession!.id)
        setTyping(false)
      })
      .catch(() => {
        toast.error("Something went wrong!");
      });
  };

  return (
    <>
      <MainContainer
        className="max-h-[50rem] w-full max-w-[80rem] rounded-md border p-8 font-custom shadow-xl"
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          margin: "auto",
          zIndex: 10,
        }}
      >
        <div className={visible ? "visible" : "hidden"}>
          <Sidebar position="left">
            <div className="flex flex-col gap-1 overflow-x-hidden px-3 pt-3 min-w-[13rem] max-w-[13rem] w-full h-full">
              <div className="flex flex-col flex-1">
                <div className="flex justify-between pb-5">
                  <Button
                    text
                    icon="material-icons-round mi-arrow-back-ios text-3xl text-blue-100 font-semibold"
                    onClick={() => {
                      setVisible(!visible);
                    }}
                  />
                  <Button
                    text
                    icon="material-icons-round mi-add-circle text-3xl text-blue-100 font-semibold"
                    onClick={() => {
                      setShowCreateForm(true);
                    }}
                  />
                </div>
                {chatSessions?.map((session, i) => (
                  <div
                    key={i}
                    className="cursor-pointer truncate rounded-sm p-1 hover:bg-blue-100 hover:text-blue-950"
                    onClick={() => {
                      handleSessionChange(session);
                    }}
                  >
                    {session.title}
                  </div>
                ))}
              </div>
              {/* Spacer div to push the last div to the bottom */}
              <div className="flex-grow"></div>
              <div className="mt-3">
                <div className="dropdown dropdown-top w-full bg-blue-950">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn m-1 w-full bg-blue-950 border-blue-950 text-blue-100 hover:bg-blue-100 hover:text-blue-950"
                  >
                    {selectedTeam?.teamName || "Select Team"}
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow rounded-box w-48 bg-blue-100"
                  >
                    {teams?.map((team, index) => (
                      <li
                        key={index}
                        className="bg-blue-100 text-blue-950 hover:bg-blue-950 hover:text-blue-100 rounded-md"
                      >
                        <a onClick={() => handleTeamChange(team)}>
                          {team.teamName}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Sidebar>
        </div>
        {showCreateForm ? (
          <CreateSessionForm setShowCreateForm={setShowCreateForm} />
        ) : (
          <div className="w-full">
            <ChatContainer>
              <ConversationHeader className="mb-8">
                <ConversationHeader.Content
                  userName={
                    <div className="flex w-full items-center justify-between bg-blue-200">
                      <div className="flex items-center gap-2 text-2xl text-blue-950">
                        <div className={visible ? "hidden" : "visible"}>
                          <Button
                            text
                            icon="material-icons-round mi-arrow-forward-ios text-2xl text-blue-950 font-semibold"
                            onClick={() => {
                              setVisible(!visible);
                            }}
                          />
                        </div>
                        <div>
                          {selectedChatSession?.title?.substring(0, 45)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="border-1 rounded-sm border border-green-400 bg-green-200 p-1.5 px-2 text-green-800 cursor-pointer">
                          {selectedTeam?.balance_credits} credits remaining
                        </div>
                      </div>
                    </div>
                  }
                />
              </ConversationHeader>
              <MessageList
                typingIndicator={
                  typing ? <TypingIndicator content="Aeos is typing" /> : null
                }
                className="pb-10"
              >
                <div className="w-full">
                  {messages?.map((message, i) => {
                    return <Message key={i} model={message}></Message>;
                  })}
                </div>
              </MessageList>
              <MessageInput
                placeholder="Type message here"
                activateAfterChange
                onSend={getAiResponse}
              />
            </ChatContainer>
          </div>
        )}
      </MainContainer>
    </>
  );
};

export default ChatSessionFunction;
