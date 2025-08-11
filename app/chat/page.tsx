"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ImageIcon, ArrowLeft, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: "text" | "image" | "file"
  file_url?: string
  is_read: boolean
  created_at: string
  sender_name: string
  sender_avatar?: string
}

interface Conversation {
  user_id: string
  user_name: string
  user_avatar?: string
  user_role: string
  last_message?: string
  last_message_time?: string
  unread_count: number
}

export default function ChatPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedUserData, setSelectedUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const withParam = searchParams.get("with")

  useEffect(() => {
    if (session?.user) {
      loadConversations()
      if (withParam) {
        setSelectedUser(withParam)
        loadUserData(withParam)
        loadMessages(withParam)
      }
    }
  }, [session, withParam])

  useEffect(() => {
    if (selectedUser && session?.user) {
      // Setup Server-Sent Events for real-time messages
      const eventSource = new EventSource(`/api/chat/stream?userId=${session.user.id}&withUser=${selectedUser}`)

      eventSource.onmessage = (event) => {
        const message = JSON.parse(event.data)
        setMessages((prev) => [...prev, message])
        scrollToBottom()

        // Mark message as read if it's from the other user
        if (message.sender_id !== session.user.id) {
          markAsRead(message.id)
        }
      }

      eventSource.onerror = (error) => {
        console.error("SSE error:", error)
      }

      eventSourceRef.current = eventSource

      return () => {
        eventSource.close()
      }
    }
  }, [selectedUser, session?.user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/chat/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const userData = await response.json()
        setSelectedUserData(userData)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const loadMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?with=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        // Mark all messages as read
        await markAllAsRead(userId)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return

    setSending(true)
    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: selectedUser,
          content: newMessage,
          message_type: "text",
        }),
      })

      if (response.ok) {
        setNewMessage("")
        // Message will be added via SSE
      } else {
        toast.error("Erro ao enviar mensagem")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/chat/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      })
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const markAllAsRead = async (userId: string) => {
    try {
      await fetch(`/api/chat/read-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
    } catch (error) {
      console.error("Error marking all messages as read:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!session) {
    return <div>Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
            </div>
            {selectedUserData && (
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUserData.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{selectedUserData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{selectedUserData.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {selectedUserData.role === "company" ? "Empresa" : "Anfitrião"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Conversas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Carregando...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Nenhuma conversa ainda</div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.user_id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                            selectedUser === conv.user_id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                          }`}
                          onClick={() => {
                            setSelectedUser(conv.user_id)
                            loadUserData(conv.user_id)
                            loadMessages(conv.user_id)
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conv.user_avatar || "/placeholder.svg"} />
                              <AvatarFallback>{conv.user_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">{conv.user_name}</p>
                                {conv.unread_count > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 truncate">{conv.last_message || "Sem mensagens"}</p>
                                {conv.last_message_time && (
                                  <p className="text-xs text-gray-400">
                                    {formatDistanceToNow(new Date(conv.last_message_time), {
                                      addSuffix: true,
                                      locale: ptBR,
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  {selectedUserData && (
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={selectedUserData.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{selectedUserData.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{selectedUserData.name}</CardTitle>
                            <Badge variant="outline">
                              {selectedUserData.role === "company" ? "Empresa" : "Anfitrião"}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  )}

                  {/* Messages */}
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[calc(100vh-400px)] p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === session.user.id ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender_id === session.user.id
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 text-gray-900"
                              }`}
                            >
                              {message.message_type === "image" && message.file_url ? (
                                <div className="space-y-2">
                                  <img
                                    src={message.file_url || "/placeholder.svg"}
                                    alt="Imagem enviada"
                                    className="rounded max-w-full h-auto"
                                  />
                                  {message.content && <p className="text-sm">{message.content}</p>}
                                </div>
                              ) : (
                                <p className="text-sm">{message.content}</p>
                              )}
                              <p
                                className={`text-xs mt-1 ${
                                  message.sender_id === session.user.id ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">Selecione uma conversa</p>
                    <p className="text-sm">Escolha uma conversa para começar a conversar</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
