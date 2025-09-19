import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Post } from "./PostList";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";

interface Props {
  communityId: number;
}

interface PostWithCommunity extends Post {
  communities: {
    name: string;
  };
}

const fetchCommunityPost = async (
  communityId: number
): Promise<PostWithCommunity[]> => {
  const [{ data: countsData, error: countsErr }, { data: baseData, error: baseErr }] = await Promise.all([
    supabase.rpc("get_posts_with_counts"),
    supabase
      .from("posts")
      .select("id,title,content,created_at,image_url,avatar_url,is_announcement,author,community_id,communities(name)")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false }),
  ]);
  if (countsErr) throw new Error(countsErr.message);
  if (baseErr) throw new Error(baseErr.message);
  const countsById = new Map<number, any>(
    ((countsData as any[]) || []).map((p) => [p.id as number, p])
  );
  const merged: PostWithCommunity[] = ((baseData as any[]) || []).map((p: any) => {
    const c = countsById.get(p.id) || {};
    return {
      ...p,
      like_count: c.like_count ?? 0,
      comment_count: c.comment_count ?? 0,
    } as PostWithCommunity;
  });
  return merged;
};

const fetchCommunityInfo = async (
  communityId: number
): Promise<{ name: string } | null> => {
  const { data, error } = await supabase
    .from("communities")
    .select("name")
    .eq("id", communityId)
    .single();
  if (error) return null;
  return data as { name: string };
};

export const CommunityDisplay = ({ communityId }: Props) => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const { data, error, isLoading } = useQuery<PostWithCommunity[], Error>({
    queryKey: ["communityPost", communityId],
    queryFn: () => fetchCommunityPost(communityId),
  });

  const { data: communityInfo } = useQuery<{ name: string } | null, Error>({
    queryKey: ["communityInfo", communityId],
    queryFn: () => fetchCommunityInfo(communityId),
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
      <div className="flex items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-mint/20 border-t-teal rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-2 border-sage/10 rounded-full animate-ping"></div>
        </div>
        <span className="ml-6 text-deep-teal dark:text-cream font-mono text-base">
          Loading community<span className="animate-pulse">...</span>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-8 max-w-lg">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-sm">!</span>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold font-mono">Community Load Error</h3>
              <p className="text-red-300 text-sm font-mono mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const communityName = communityInfo?.name || (data && data.length > 0 && data[0]?.communities?.name) || "Community";
  
  // Separate announcements from regular posts
  const announcements = sorted?.filter(post => post.is_announcement) || [];
  const regularPosts = sorted?.filter(post => !post.is_announcement) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Community Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tcream/10 via-mint/15 to-sage/10 dark:from-deepteal/20 dark:via-mediumteal/15 dark:to-sage/10 backdrop-blur-xl border border-mint/20 dark:border-sage/10 shadow-2xl">
        
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/5 via-sage/10 to-mint/5 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-mediumteal/20 to-transparent rounded-bl-full"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex items-center space-x-6 mb-6">
            {/* Community Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mediumteal to-sage shadow-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
              </svg>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center space-x-4">
              <div className="h-4 w-px bg-gradient-to-b from-transparent via-sage/50 to-transparent"></div>
              
              <div className="flex items-center space-x-1">
                <span className="text-sm font-mono text-sage dark:text-mint">ID:</span>
                <span className="text-sm font-mono text-mediumteal">{communityId.toString().padStart(4, '0')}</span>
              </div>
            </div>
          </div>
          
          {/* Community Title */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold font-mono bg-gradient-to-r from-deepteal via-mediumteal to-sage bg-clip-text text-tcream">
              {communityName}
            </h1>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-mono text-sage dark:text-mint">Community Posts</span>
              </div>
              
              {/* Stats */}
              <div className="flex items-center space-x-4">
                <div className="px-4 py-2 bg-mediumteal/10 border border-mediumteal/20 rounded-full">
                  <span className="text-mediumteal text-sm font-mono">{sorted?.length || 0} posts</span>
                </div>
                
                {announcements.length > 0 && (
                  <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <span className="text-orange-400 text-sm font-mono">{announcements.length} pinned</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Scan line effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mediumteal/60 to-transparent"></div>
      </div>

      {/* Controls Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-1 bg-gradient-to-b from-mediumteal to-sage rounded-full"></div>
          <h2 className="text-xl font-bold font-mono text-deepteal dark:text-tcream">
            Feed
          </h2>
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
            <svg className="w-4 h-4 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
              <h3 className="text-lg font-bold font-mono text-deepteal dark:text-tcream">
                Pinned Announcements
              </h3>
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
        <div className="space-y-6">
          {announcements.length > 0 && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-mediumteal rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <h3 className="text-lg font-bold font-mono text-deepteal dark:text-tcream">
                  Recent Posts
                </h3>
              </div>
              <div className="h-px bg-gradient-to-r from-mediumteal/50 via-sage/20 to-transparent flex-1"></div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {regularPosts.map((post, index) => (
              <div 
                key={post.id}
                className="group transform hover:scale-105 transition-all duration-200"
                style={{ animationDelay: `${(index + announcements.length) * 50}ms` }}
              >
                <PostItem post={post} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sorted && sorted.length === 0 && (
        <div className="text-center py-20">
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-mint/20 via-sage/20 to-mediumteal/20 rounded-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
            <svg className="w-16 h-16 text-teal relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" strokeWidth={1.5} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
            </svg>
          </div>
          <h3 className="text-2xl font-mono text-deepteal dark:text-tcream mb-3">
            No Posts in {communityName}
          </h3>
          <p className="text-sage dark:text-mint text-base max-w-md mx-auto leading-relaxed">
            This community is waiting for its first post. Be the pioneer and share something amazing!
          </p>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-teal rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-mint rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};