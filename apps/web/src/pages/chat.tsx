import type { ChatMessage, ChatRoom } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Skeleton, useToast } from "@family/ui";
import { MessageCircle, MessageSquare, Plus, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";
import { api } from "../lib/api-client.js";
import { connectSse } from "../lib/sse.js";
import { useI18n } from "../i18n/index.js";
import { useSeo } from "../lib/seo.js";

interface RoomListResponse {
  items: ChatRoom[];
  total: number;
}

interface MessageListResponse {
  items: ChatMessage[];
  total: number;
}

export function ChatPage() {
  const { t } = useI18n();
  useSeo("chat.heading");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast().toast;
  const [searchParams] = useSearchParams();

  // A search result can deep-link straight into a room via ?room=.
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(() =>
    searchParams.get("room"),
  );
  const [newRoomName, setNewRoomName] = useState("");
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedRoomRef = useRef<string | null>(null);
  selectedRoomRef.current = selectedRoomId;

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: () => api.get<RoomListResponse>("/chat/rooms"),
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", selectedRoomId],
    queryFn: () => api.get<MessageListResponse>(`/chat/rooms/${selectedRoomId}/messages`),
    enabled: selectedRoomId !== null,
  });

  const createRoom = useMutation({
    mutationFn: (name: string) => api.post<{ room: ChatRoom }>("/chat/rooms", { name }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
      setNewRoomName("");
      setSelectedRoomId(result.room.id);
      toast("Room created", { variant: "success" });
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Couldn't create the room", { variant: "error" });
    },
  });

  const send = useMutation({
    mutationFn: (body: string) => api.post(`/chat/rooms/${selectedRoomId}/messages`, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedRoomId] });
      void queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
      setDraft("");
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Couldn't send the message", { variant: "error" });
    },
  });

  const markRead = useMutation({
    mutationFn: (roomId: string) => api.post(`/chat/rooms/${roomId}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["chat-rooms"] }),
  });

  // Live stream: append messages to the open room, bump unread elsewhere.
  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const controller = new AbortController();
    let retryTimer: number | undefined;

    const connect = () => {
      void connectSse(
        "/chat/events",
        token,
        (event) => {
          if (event.type !== "message") return;
          const { roomId, message } = event as unknown as {
            roomId: string;
            message: ChatMessage;
          };

          if (selectedRoomRef.current === roomId) {
            queryClient.setQueryData<MessageListResponse>(
              ["chat-messages", roomId],
              (old) =>
                old && !old.items.some((m) => m.id === message.id)
                  ? { ...old, items: [message, ...old.items], total: old.total + 1 }
                  : old,
            );
          } else {
            void queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
          }
        },
        controller.signal,
      ).catch(() => {
        retryTimer = window.setTimeout(connect, 3000);
      });
    };

    connect();
    return () => {
      controller.abort();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  function selectRoom(roomId: string) {
    setSelectedRoomId(roomId);
    markRead.mutate(roomId);
  }

  const selectedRoom = roomsData?.items.find((room) => room.id === selectedRoomId);
  const displayMessages = messagesData ? [...messagesData.items].reverse() : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("chat.heading")}</h1>
          <p className="mt-1 text-sm text-muted">Conversations with the whole nest</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newRoomName.trim()) createRoom.mutate(newRoomName.trim());
            }}
          >
            <Input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="New room…"
              aria-label="New room name"
              className="h-9"
            />
            <Button type="submit" size="icon" className="size-9 shrink-0" disabled={createRoom.isPending}>
              <Plus />
            </Button>
          </form>

          <ul className="mt-3 space-y-1">
            {roomsLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            {roomsData?.items.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => selectRoom(room.id)}
                  className={[
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                    room.id === selectedRoomId
                      ? "bg-surface-2 text-foreground"
                      : "text-muted hover:bg-surface-2/70 hover:text-foreground",
                  ].join(" ")}
                >
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{room.name}</span>
                    {room.lastMessage && (
                      <span className="block truncate text-xs text-muted">
                        {room.lastMessage.createdBy.name}: {room.lastMessage.body}
                      </span>
                    )}
                  </span>
                  {room.unreadCount > 0 && (
                    <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-fg">
                      {room.unreadCount > 99 ? "99+" : room.unreadCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {roomsData?.items.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted">{t("chat.empty")}</p>
            )}
          </ul>
        </aside>

        <section className="flex h-[70vh] flex-col rounded-2xl border border-border bg-surface shadow-sm">
          {!selectedRoom ? (
            <div className="grid flex-1 place-items-center text-sm text-muted">
              Pick a room to start chatting
            </div>
          ) : (
            <>
              <header className="flex items-center gap-2 border-b border-border px-4 py-3">
                <MessageCircle className="size-4 text-primary" />
                <span className="font-semibold">{selectedRoom.name}</span>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messagesLoading && (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-2/3 rounded-xl" />
                    ))}
                  </div>
                )}
                {displayMessages.length === 0 && !messagesLoading && (
                  <p className="pt-8 text-center text-sm text-muted">
                    {t("chat.roomEmpty")}
                  </p>
                )}
                {displayMessages.map((message) => {
                  const mine = message.createdBy.id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={[
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                          mine ? "rounded-br-sm bg-primary text-primary-fg" : "rounded-bl-sm bg-surface-2",
                        ].join(" ")}
                      >
                        {!mine && (
                          <Link
                            to={`/members/${message.createdBy.id}`}
                            className="mb-0.5 block text-xs font-semibold hover:underline"
                          >
                            {message.createdBy.name}
                          </Link>
                        )}
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        <p className={["mt-0.5 text-[10px]", mine ? "text-primary-fg/70" : "text-muted"].join(" ")}>
                          {new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form
                className="flex items-center gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) send.mutate(draft.trim());
                }}
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  aria-label="Message"
                  className="h-10"
                />
                <Button type="submit" size="icon" className="size-10 shrink-0" disabled={send.isPending || !draft.trim()}>
                  <Send />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}