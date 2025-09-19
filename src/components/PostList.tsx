import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { useMemo, useState } from "react";

export interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string;
  avatar_url?: string;
  like_count?: number;
  comment_count?: number;
  is_announcement?: boolean;
  author?: string;
  community_id?: number;
}

const fetchPosts = async (): Promise<Post[]> => {
  // Fetch counts (like_count/comment_count) via RPC
  const [{ data: countsData, error: countsErr }, { data: baseData, error: baseErr }] = await Promise.all([
    supabase.rpc("get_posts_with_counts"),
    supabase
      .from("posts")
      .select("id,title,content,created_at,image_url,avatar_url,is_announcement,author,community_id")
      .order("created_at", { ascending: false }),
  ]);
  if (countsErr) throw new Error(countsErr.message);
  if (baseErr) throw new Error(baseErr.message);
  const countsById = new Map<number, any>(
    ((countsData as any[]) || []).map((p) => [p.id as number, p])
  );
  const merged: Post[] = ((baseData as any[]) || []).map((p) => {
    const c = countsById.get(p.id) || {};
    return {
      id: p.id,
      title: p.title,
      content: p.content,
      created_at: p.created_at,
      image_url: p.image_url,
      avatar_url: p.avatar_url ?? undefined,
      like_count: c.like_count ?? 0,
      comment_count: c.comment_count ?? 0,
      is_announcement: p.is_announcement ?? false,
      author: p.author ?? undefined,
      community_id: p.community_id ?? undefined,
    } as Post;
  });
  return merged;
};

export const PostList = () => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const { data, error, isLoading } = useQuery<Post[], Error>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const sorted = useMemo(() => {
    const list = [...(data || [])];
    return list.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [data, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-mint/20 border-t-mediumteal rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-sage/10 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-deepteal dark:text-tcream font-mono text-sm">
          Loading posts<span className="animate-pulse">...</span>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-6 max-w-md">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-xs">!</span>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold">System Error</h3>
              <p className="text-red-300 text-sm font-mono">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Separate announcements from regular posts
  const announcements = sorted?.filter(post => post.is_announcement) || [];
  const regularPosts = sorted?.filter(post => !post.is_announcement) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with Sort Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-1 bg-gradient-to-b from-mediumteal to-sage rounded-full"></div>
          <h1 className="text-2xl font-bold font-mono text-deepteal dark:text-tcream">
            Community Feed
          </h1>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-mediumteal/10 border border-deepteal/20 rounded-full">
              <span className="text-mediumteal text-sm font-mono">{sorted?.length || 0} posts</span>
            </div>
            {announcements.length > 0 && (
              <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <span className="text-orange-400 text-sm font-mono">{announcements.length} pinned</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <label className="mr-3 text-sm font-mono text-sage dark:text-mint">
            Sort by
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="appearance-none bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 rounded-xl px-4 py-2 pr-10 text-deepteal dark:text-tcream text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mediumteal/50 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
              <h2 className="text-lg font-bold font-mono text-deepteal dark:text-tcream">
                Pinned Announcements
              </h2>
            </div>
            <div className="h-px bg-gradient-to-r from-orange-500/50 via-orange-500/20 to-transparent flex-1"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {announcements.map((post, index) => (
              <div 
                key={post.id}
                className="relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Announcement Badge */}
                <div className="absolute -top-2 -right-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                  📌
                </div>
                <div className="transform hover:scale-105 transition-transform duration-200">
                  <PostItem post={post} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Posts Section */}
      {regularPosts.length > 0 && (
        <div>
          {announcements.length > 0 && (
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <h2 className="text-lg font-bold font-mono text-deepteal dark:text-tcream">
                  Recent Posts
                </h2>
              </div>
              <div className="h-px bg-gradient-to-r from-mediumteal/50 via-sage/20 to-transparent flex-1"></div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {regularPosts.map((post, index) => (
              <div 
                key={post.id}
                className="group transform hover:scale-105 transition-all duration-200 hover:z-10"
                style={{ animationDelay: `${(index + announcements.length) * 50}ms` }}
              >
                <PostItem post={post} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sorted?.length === 0 && (
        <div className="text-center py-20">
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-mint/20 via-sage/20 to-mediumteal/20 rounded-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
            <svg className="w-16 h-16 text-mediumteal relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-mono text-deepteal dark:text-tcream mb-3">
            No Posts Yet
          </h3>
          <p className="text-sage dark:text-mint text-base max-w-md mx-auto leading-relaxed">
            The community is waiting for fresh content. Be the first to share something amazing!
          </p>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-teal rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-mint rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {/* Load more indicator (if you implement pagination later) */}
      <div className="flex justify-center pt-8">
        <div className="h-px bg-gradient-to-r from-transparent via-sage/30 to-transparent w-full max-w-xs"></div>
      </div>
    </div>
  );
};