import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i} className="mt-4 mb-1 font-semibold text-sm">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="mt-5 mb-1 font-semibold">{line.slice(3)}</h2>;
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} className="ml-4 list-disc text-sm">{renderInline(line.slice(2))}</li>;
    if (line.match(/^[A-D]\)/)) return (
      <div key={i} className="flex gap-2 py-0.5">
        <span className="shrink-0 font-semibold text-primary text-sm">{line[0]})</span>
        <span className="text-sm">{renderInline(line.slice(2))}</span>
      </div>
    );
    if (line === "") return <div key={i} className="h-2" />;
    return <p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>;
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

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-3 text-sm text-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
        A
      </div>
      <div className={cn("flex-1 space-y-0.5 pt-0.5 text-foreground")}>
        {renderMarkdown(message.content)}
      </div>
    </div>
  );
}
