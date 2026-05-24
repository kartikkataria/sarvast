"use client";

import { useState } from "react";
import { Share2, Calendar, Send, Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  caption: string;
  mediaUrl?: string;
  publicMediaUrl?: string;
};

export function PostCreator({ caption: initialCaption, mediaUrl, publicMediaUrl }: Props) {
  const [caption, setCaption] = useState(initialCaption);
  const [mode, setMode] = useState<"idle" | "schedule">("idle");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"posted" | "scheduled" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const savePost = async (publish: boolean) => {
    setLoading(true);
    setErrorMsg("");

    // Create the post record
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        caption,
        media_url: publicMediaUrl ?? null,
        scheduled_at: !publish && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }),
    });
    const post = await res.json();

    if (!res.ok) {
      setErrorMsg(post.error ?? "Failed to save post");
      setLoading(false);
      setResult("error");
      return;
    }

    if (publish) {
      // Publish immediately
      const pubRes = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      const pubData = await pubRes.json();
      if (!pubRes.ok) {
        setErrorMsg(pubData.error ?? "Publish failed");
        setResult("error");
      } else {
        setResult("posted");
      }
    } else {
      setResult("scheduled");
    }
    setLoading(false);
  };

  if (result === "posted") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <Check className="h-4 w-4" />
        Posted to Instagram successfully.
      </div>
    );
  }

  if (result === "scheduled") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Calendar className="h-4 w-4" />
        Scheduled for {new Date(scheduledAt).toLocaleString()} and added to your Content Calendar.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Share2 className="h-4 w-4 text-pink-600" />
        <span className="text-sm font-medium">Instagram Post</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Preview image */}
        {mediaUrl && (
          <img src={mediaUrl} alt="Post visual" className="w-full rounded-lg object-cover" style={{ maxHeight: 240 }} />
        )}

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
        />

        {/* Schedule picker */}
        {mode === "schedule" && (
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <button onClick={() => setMode("idle")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error */}
        {result === "error" && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => savePost(true)}
            disabled={loading}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
            )}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Post now
          </button>

          {mode === "idle" ? (
            <button
              onClick={() => setMode("schedule")}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Calendar className="h-3.5 w-3.5" />
              Schedule
            </button>
          ) : (
            <button
              onClick={() => savePost(false)}
              disabled={loading || !scheduledAt}
              className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
              Confirm schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
