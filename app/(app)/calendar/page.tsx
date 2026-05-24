import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays, Clock, CheckCircle, AlertCircle, FileText, Share2 } from "lucide-react";
import Link from "next/link";

type Post = {
  id: string;
  platform: string;
  caption: string;
  media_url: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     color: "bg-muted text-muted-foreground",   icon: FileText     },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700",        icon: Clock        },
  published: { label: "Published", color: "bg-green-100 text-green-700",      icon: CheckCircle  },
  failed:    { label: "Failed",    color: "bg-red-100 text-red-600",          icon: AlertCircle  },
};

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "instagram") return <Share2 className="h-4 w-4 text-pink-600" />;
  return <CalendarDays className="h-4 w-4 text-muted-foreground" />;
}

function PostCard({ post }: { post: Post }) {
  const status = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = status.icon;
  const date = post.scheduled_at ?? post.published_at ?? post.created_at;

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
      {post.media_url && (
        <img src={post.media_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <PlatformIcon platform={post.platform} />
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-foreground">{post.caption}</p>
      </div>
    </div>
  );
}

export default async function CalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("content_posts")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const groups = {
    scheduled: (posts ?? []).filter((p) => p.status === "scheduled"),
    draft:     (posts ?? []).filter((p) => p.status === "draft"),
    published: (posts ?? []).filter((p) => p.status === "published"),
    failed:    (posts ?? []).filter((p) => p.status === "failed"),
  };

  const hasAny = (posts ?? []).length > 0;

  return (
    <>
      <PageHeader
        title="Content Calendar"
        description="Posts created by Agni — scheduled, drafted, and published"
        agent="Vani"
      />

      {!hasAny ? (
        <EmptyState
          icon={CalendarDays}
          title="No posts yet"
          description="Ask Agni to write a social media post and it will appear here ready to schedule or publish."
          action={
            <Link href="/chat" className="text-sm font-medium text-primary hover:underline">
              Open Briefing →
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {(["scheduled", "draft", "published", "failed"] as const).map((status) => {
            const items = groups[status];
            if (!items.length) return null;
            return (
              <section key={status}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {STATUS_CONFIG[status].label} · {items.length}
                </h2>
                <div className="space-y-3">
                  {items.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
