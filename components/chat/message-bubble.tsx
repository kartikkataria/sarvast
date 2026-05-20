import { Zap, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i} className="mt-3 mb-1 font-semibold">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="mt-4 mb-1 text-base font-semibold">{line.slice(3)}</h2>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc">{renderInline(line.slice(2))}</li>;
    if (line === "") return <br key={i} />;
    return <p key={i}>{renderInline(line)}</p>;
  });
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
        isUser
          ? "bg-foreground text-background"
          : "bg-orange-100 text-orange-600"
      )}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />}
      </div>
      <div className={cn(
        "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isUser
          ? "rounded-tr-sm bg-foreground text-background"
          : "rounded-tl-sm bg-card text-foreground shadow-sm border border-border"
      )}>
        {isUser
          ? <p>{message.content}</p>
          : <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
        }
      </div>
    </div>
  );
}
