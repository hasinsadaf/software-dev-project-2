import { useEffect, useMemo, useState, Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { LikeButton } from "../components/LikeButton";
import { CommentSection } from "../components/CommentSection";

// Lazy import SyntaxHighlighter to avoid hard dependency issues.
const LazySyntaxHighlighter = (props: any) => {
  const [lib, setLib] = useState<{ Comp: any; style: any } | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const load = async (s: string) => (await import(/* @vite-ignore */ s));
        const mod: any = await load("react-syntax-highlighter");
        const styleMod: any = await load("react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark");
        const Comp = mod.Prism || mod.Light || mod.default;
        if (mounted) setLib({ Comp, style: styleMod.default });
      } catch {
        // keep fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  if (!lib) {
    return (
      <pre className="bg-gray-900 text-gray-100 text-sm rounded-md p-3 overflow-auto shadow" data-fallback="code-block">
        <code>{props.children}</code>
      </pre>
    );
  }
  const { Comp, style } = lib;
  return <Comp language={props.language || "tsx"} style={style}>{props.children}</Comp>;
};

interface PostRow {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url?: string | null;
  avatar_url?: string | null;
  author: string;
  community_id: number | null;
}

interface CommunityRow {
  id: number;
  name: string;
  author: string;
}

const fetchPost = async (id: number): Promise<PostRow> => {
  const { data, error } = await supabase
    .from("posts")
    .select("id,title,content,created_at,image_url,avatar_url,author,community_id")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as PostRow;
};

const fetchCommunity = async (id: number | null): Promise<CommunityRow | null> => {
  if (!id) return null;
  const { data, error } = await supabase
    .from("communities")
    .select("id,name,author")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as CommunityRow;
};

// Very basic parser: splits fenced code blocks ```lang ... ``` from plain text
function parseContentBlocks(text: string): Array<{ type: "code" | "text"; lang?: string; value: string }> {
  const blocks: Array<{ type: "code" | "text"; lang?: string; value: string }> = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const [full, lang, code] = match;
    const start = match.index;
    if (start > lastIndex) {
      blocks.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    blocks.push({ type: "code", lang: lang || "", value: code.trimEnd() });
    lastIndex = start + full.length;
  }
  if (lastIndex < text.length) {
    blocks.push({ type: "text", value: text.slice(lastIndex) });
  }
  return blocks;
}

export const PostDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: post, isLoading: postLoading, error: postErr } = useQuery<PostRow, Error>({
    queryKey: ["post-details", postId],
    queryFn: () => fetchPost(postId),
    enabled: Number.isFinite(postId),
  });

  const { data: community, isLoading: commLoading, error: commErr } = useQuery<CommunityRow | null, Error>({
    queryKey: ["post-details-community", post?.community_id],
    queryFn: () => fetchCommunity(post?.community_id ?? null),
    enabled: !!post?.community_id,
  });

  const canDelete = useMemo(() => {
    if (!user || !post) return false;
    if (post.author === user.id) return true;
    if (community && community.author === user.id) return true;
    return false;
  }, [user, post, community]);

  const { mutate: deletePost, isPending: isDeleting, error: deleteErr } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.removeQueries({ queryKey: ["post-details", postId] });
    },
  });

  if (postLoading || commLoading) {
    return <div className="py-6 text-sm text-gray-500">Loading…</div>;
  }
  if (postErr) {
    return <div className="py-6 text-sm text-red-500">{postErr.message}</div>;
  }
  if (!post) {
    return <div className="py-6 text-sm text-gray-500">Post not found.</div>;
  }

  const blocks = parseContentBlocks(post.content || "");
  const createdAt = new Date(post.created_at);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 -mt-6 pt-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-3xl mx-auto mt-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">{post.title}</h1>

        {/* Image */}
        {post.image_url && (
          <img src={post.image_url} alt={post.title} className="w-full rounded-lg shadow-md mb-4" />
        )}

        {/* Body text + code blocks */}
        <div className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {blocks.length === 0 ? (
            <p>{post.content}</p>
          ) : (
            blocks.map((b, idx) =>
              b.type === "code" ? (
                <div key={idx} className="mb-4">
                  <Suspense fallback={<pre className="bg-gray-900 text-gray-100 rounded-md p-3 overflow-auto shadow" />}>
                    <LazySyntaxHighlighter language={b.lang}>{b.value}</LazySyntaxHighlighter>
                  </Suspense>
                </div>
              ) : (
                <p key={idx} className="mb-3">{b.value}</p>
              )
            )
          )}
        </div>

        {/* Metadata */}
        <div className="text-sm text-gray-500 mb-4">
          <span>Posted on {createdAt.toLocaleDateString()}</span>
          {community && (
            <>
              <span className="mx-2">•</span>
              <Link to={`/community/${community.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                {community.name}
              </Link>
            </>
          )}
          <span className="mx-2">•</span>
          <span>by {user?.user_metadata?.user_name || user?.email || "User"}</span>
        </div>

        {/* Reaction buttons */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <LikeButton postId={postId} />
          </div>
          <a href="#comments" className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <span>💬</span>
            <span>Comments</span>
          </a>
          {canDelete && (
            <button
              onClick={() => deletePost()}
              disabled={isDeleting}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition disabled:opacity-50"
              title="Delete post"
            >
              Delete
            </button>
          )}
        </div>

        {/* Comments Section */}
        <div id="comments" className="border-t mt-6 pt-4">
          <h3 className="text-xl font-semibold mb-4">Comments</h3>
          <CommentSection postId={postId} />
        </div>
      </div>
    </div>
  );
};

export default PostDetailsPage;


