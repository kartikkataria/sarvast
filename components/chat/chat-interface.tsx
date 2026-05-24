"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Loader2, ImageIcon, Trash2 } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { PostCreator } from "./post-creator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Help me plan a product launch campaign",
  "Create a social media banner for my brand",
  "Build a lead gen brief for our SaaS",
  "Design an ad creative for a product launch",
];

const IMAGE_MARKER = /\[\[GENERATE_IMAGE:\s*([\s\S]+?)\]\]/;
const POST_MARKER = /\[\[CREATE_POST:\s*([\s\S]+?)\]\]/;
const STORAGE_KEY = "agni-chat";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<number, { url: string; publicUrl?: string }>>({});
  const [loadingImageIndex, setLoadingImageIndex] = useState<number | null>(null);
  const [postCaptions, setPostCaptions] = useState<Record<number, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get user ID and restore session
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? "guest";
      setUserId(uid);
      try {
        const saved = localStorage.getItem(`${STORAGE_KEY}-${uid}`);
        if (saved) {
          const { messages: msgs, images } = JSON.parse(saved);
          if (msgs?.length) setMessages(msgs);
          if (images) setGeneratedImages(images);
        }
      } catch { /* ignore parse errors */ }
    });
  }, []);

  // Persist session on every change
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify({ messages, images: generatedImages }));
    } catch { /* quota exceeded */ }
  }, [messages, generatedImages, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generatedImages, loadingImageIndex]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setGeneratedImages({});
    if (userId) localStorage.removeItem(`${STORAGE_KEY}-${userId}`);
  }, [userId]);

  const generateImage = async (prompt: string, messageIndex: number) => {
    setLoadingImageIndex(messageIndex);
    try {
      const res = await fetch("/api/agents/agni/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.url) setGeneratedImages((prev) => ({ ...prev, [messageIndex]: { url: data.url, publicUrl: data.publicUrl } }));
    } catch { /* silent */ }
    finally { setLoadingImageIndex(null); }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    const userMessage: Message = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);
    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...updatedMessages, assistantMessage]);
    const assistantIndex = updatedMessages.length;

    try {
      const response = await fetch("/api/agents/agni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      if (!response.ok) throw new Error("Failed");
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullContent };
          return updated;
        });
      }

      const imageMatch = fullContent.match(IMAGE_MARKER);
      if (imageMatch) await generateImage(imageMatch[1].trim(), assistantIndex);

      const postMatch = fullContent.match(POST_MARKER);
      if (postMatch) setPostCaptions((prev) => ({ ...prev, [assistantIndex]: postMatch[1].trim() }));
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: "Something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">A</div>
            <h2 className="text-lg font-semibold text-foreground">Hi, I'm Agni</h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
              I can build campaign briefs and generate marketing visuals. What would you like to create?
            </p>
          </div>
          <div className="grid w-full max-w-lg grid-cols-2 gap-2">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-left text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:text-foreground hover:shadow-md">
                {(s.startsWith("Create") || s.startsWith("Design")) ? (
                  <span className="flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5 shrink-0 text-primary" />{s}</span>
                ) : s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {messages.map((msg, i) => (
              <div key={i}>
                <MessageBubble message={msg}
                  isLast={i === messages.length - 1}
                  onOptionSelect={!isStreaming ? sendMessage : undefined}
                  generatedImage={generatedImages[i]?.url}
                  imageLoading={loadingImageIndex === i}
                />
                {postCaptions[i] && (
                  <div className="mt-3 ml-9">
                    <PostCreator
                      caption={postCaptions[i]}
                      mediaUrl={generatedImages[i]?.url}
                      publicMediaUrl={generatedImages[i]?.publicUrl}
                    />
                  </div>
                )}
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">A</div>
                <Loader2 className="mt-1 h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      <div className="border-t border-border bg-background px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm transition-shadow focus-within:shadow-md">
            <textarea ref={textareaRef} rows={1} value={input} onChange={handleInput} onKeyDown={handleKeyDown}
              placeholder="Ask Agni to build a brief or create a visual…"
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
              style={{ maxHeight: "160px" }} />
            {messages.length > 0 && !isStreaming && (
              <button onClick={clearChat} className="shrink-0 text-muted-foreground/40 transition-colors hover:text-muted-foreground" title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}
              className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                input.trim() && !isStreaming ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground")}>
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.5} />}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/50">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
