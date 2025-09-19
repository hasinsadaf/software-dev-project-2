import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import type { Post } from "../components/PostList";
import { Link } from "react-router-dom";

type SortMetric = "likes" | "comments";

interface Community {
  id: number;
  name: string;
  description: string | null;
  member_count?: number;
  activity_score?: number;
}

const fetchTrendingPosts = async (): Promise<Post[]> => {
  const [{ data: countsData, error: countsErr }, { data: baseData, error: baseErr }] = await Promise.all([
    supabase.rpc("get_posts_with_counts"),
    supabase
      .from("posts")
      .select("id,title,community_id,created_at,image_url,avatar_url,is_announcement,communities(name)")
      .order("created_at", { ascending: false }),
  ]);
  if (countsErr) throw new Error(countsErr.message);
  if (baseErr) throw new Error(baseErr.message);
  const countsById = new Map<number, any>(
    ((countsData as any[]) || []).map((p) => [p.id as number, p])
  );
  const merged: any[] = ((baseData as any[]) || []).map((p: any) => ({
    ...p,
    like_count: countsById.get(p.id)?.like_count ?? 0,
    comment_count: countsById.get(p.id)?.comment_count ?? 0,
  }));
  return merged as Post[];
};

const fetchCommunitiesWithStats = async (): Promise<Community[]> => {
  const { data: comms, error: commErr } = await supabase
    .from("communities")
    .select("id,name,description")
    .order("created_at", { ascending: false });
  if (commErr) throw new Error(commErr.message);

  const { data: posts, error: postErr } = await supabase
    .from("posts")
    .select("id,community_id")
    .not("community_id", "is", null);
  if (postErr) throw new Error(postErr.message);

  const counts = new Map<number, number>();
  (posts || []).forEach((p: any) => {
    const id = p.community_id as number;
    counts.set(id, (counts.get(id) || 0) + 1);
  });

  return (comms || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    member_count: counts.get(c.id) || 0,
    activity_score: counts.get(c.id) || 0,
  })) as Community[];
};

export const ExplorePage = () => {
  const [sortMetric, setSortMetric] = useState<SortMetric>("likes");

  const { data: posts, isLoading: postsLoading, error: postsErr } = useQuery<Post[], Error>({
    queryKey: ["trendingPosts"],
    queryFn: fetchTrendingPosts,
  });

  const { data: communities, isLoading: commLoading, error: commErr } = useQuery<Community[], Error>({
    queryKey: ["popularCommunities"],
    queryFn: fetchCommunitiesWithStats,
  });

  const sortedTrending = useMemo(() => {
    const list = [...(posts || [])];
    return list
      .sort((a: any, b: any) => {
        const aVal = sortMetric === "likes" ? (a.like_count || 0) : (a.comment_count || 0);
        const bVal = sortMetric === "likes" ? (b.like_count || 0) : (b.comment_count || 0);
        return bVal - aVal;
      })
      .slice(0, 8);
  }, [posts, sortMetric]);

  const sortedCommunities = useMemo(() => {
    const list = [...(communities || [])];
    return list
      .sort((a, b) => {
        const aVal = (a.member_count || 0) + (a.activity_score || 0);
        const bVal = (b.member_count || 0) + (b.activity_score || 0);
        return bVal - aVal;
      })
      .slice(0, 8);
  }, [communities]);

  const announcements = useMemo(() => {
    const list = [...(posts || [])];
    return list.filter((p: any) => p.is_announcement).slice(0, 8);
  }, [posts]);

  return (
    <div className="max-w-7xl mx-auto pt-8 space-y-10">
  {/* Hero Header */}
  <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tcream/10 via-mint/15 to-sage/10 dark:from-deepteal/20 dark:via-mediumteal/15 dark:to-sage/10 backdrop-blur-xl border border-mint/20 dark:border-sage/10 shadow-2xl">
    
    {/* Animated background elements */}
    <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/5 via-sage/10 to-mint/5 animate-pulse"></div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-mediumteal/20 to-transparent rounded-bl-full"></div>
    
    <div className="relative p-8 md:p-12 text-center">
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-mediumteal to-sage shadow-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-6.219-8.56" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></div>
          <span className="text-sm font-mono text-green-400">DISCOVERY MODE</span>
        </div>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold font-mono bg-gradient-to-r from-deepteal via-mediumteal to-sage bg-clip-text text-transparent mb-4">
        Explore
      </h1>
      <p className="text-base text-sage dark:text-mint font-light max-w-2xl mx-auto">
        Discover trending content, communities, and announcements across the platform
      </p>
      
      {/* Tech indicators */}
      <div className="flex items-center justify-center space-x-6 mt-8">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-mediumteal rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-mediumteal">LIVE FEED</span>
        </div>
        <div className="h-4 w-px bg-sage/30"></div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <span className="text-xs font-mono text-sage">REAL-TIME</span>
        </div>
      </div>
    </div>
    
    {/* Scan line effect */}
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mediumteal/60 to-transparent"></div>
  </header>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Trending Posts Section */}
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-1 bg-gradient-to-b from-mediumteal to-sage rounded-full"></div>
          <h2 className="text-xl font-bold font-mono text-deepteal dark:text-tcream">Trending Posts</h2>
          <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-red-400 text-xs font-mono">HOT</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono text-sage dark:text-mint">Sort</span>
          <div className="relative">
            <select
              value={sortMetric}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              className="appearance-none bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 rounded-xl px-3 py-1.5 pr-8 text-deepteal dark:text-tcream text-xs font-mono focus:outline-none focus:ring-2 focus:ring-mediumteal/50 focus:border-transparent shadow-lg transition-all duration-200"
            >
              <option value="likes">Most Likes</option>
              <option value="comments">Most Comments</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3 h-3 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {postsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-mint/20 border-t-mediumteal rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border border-sage/10 rounded-full animate-ping"></div>
          </div>
          <span className="ml-3 text-sage dark:text-mint font-mono text-sm">Loading posts...</span>
        </div>
      ) : postsErr ? (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border border-red-500 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-xs">!</span>
            </div>
            <span className="text-red-400 font-mono text-sm">{postsErr.message}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTrending.map((p: any, index: number) => (
            <Link key={p.id} to={`/post/${p.id}`} className="block group">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 hover:border-mediumteal/40 dark:hover:border-mediumteal/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                   style={{ animationDelay: `${index * 100}ms` }}>
                
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-mediumteal/20 to-transparent rounded-bl-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-mediumteal rounded-full animate-pulse"></div>
                        <span className="font-bold font-mono text-deepteal dark:text-tcream text-sm line-clamp-2 group-hover:text-mediumteal dark:group-hover:text-sage transition-colors duration-200">
                          {p.title}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-sage dark:text-mint">
                        📍 {p.communities?.name || "Community"}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs font-mono">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/10 rounded-full">
                        <span>❤️</span>
                        <span className="text-red-400">{p.like_count ?? 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 rounded-full">
                        <span>💬</span>
                        <span className="text-blue-400">{p.comment_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status bar */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-mint/10 dark:border-sage/10">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-sage/60 dark:text-mint/60">
                        #{p.id.toString().padStart(4, '0')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-mono text-green-400">TRENDING</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>

    {/* Popular Communities Section */}
    <section className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="h-6 w-1 bg-gradient-to-b from-sage to-mint rounded-full"></div>
        <h2 className="text-xl font-bold font-mono text-deepteal dark:text-tcream">Top Communities</h2>
        <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
          <span className="text-purple-400 text-xs font-mono">POPULAR</span>
        </div>
      </div>
      
      {commLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-mint/20 border-t-sage rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border border-mediumteal/10 rounded-full animate-ping"></div>
          </div>
          <span className="ml-3 text-sage dark:text-mint font-mono text-sm">Loading communities...</span>
        </div>
      ) : commErr ? (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border border-red-500 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-xs">!</span>
            </div>
            <span className="text-red-400 font-mono text-sm">{commErr.message}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCommunities.map((c, index) => (
            <div key={c.id} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-mint/5 via-sage/10 to-mediumteal/5 dark:from-sage/10 dark:via-mint/5 dark:to-mediumteal/10 backdrop-blur-lg border border-sage/20 dark:border-mint/10 hover:border-sage/40 dark:hover:border-mint/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                 style={{ animationDelay: `${index * 50}ms` }}>
              
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-sage/0 via-mint/5 to-mediumteal/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-sage/20 to-transparent rounded-bl-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse"></div>
                      <span className="font-bold font-mono text-deepteal dark:text-tcream text-sm group-hover:text-sage dark:group-hover:text-mint transition-colors duration-200">
                        {c.name}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-mediumteal dark:text-sage leading-relaxed line-clamp-2 font-light">
                        {c.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 px-2 py-1 bg-purple-500/10 rounded-full">
                    <span className="text-xs font-mono text-purple-400">{c.member_count ?? 0}</span>
                    <span className="text-xs text-purple-300">posts</span>
                  </div>
                </div>
                
                {/* Status bar */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-sage/10 dark:border-mint/10">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-sage/60 dark:text-mint/60">
                      ID: {c.id.toString().padStart(4, '0')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-mono text-green-400">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    {/* Announcements Section */}
    <section className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="h-6 w-1 bg-gradient-to-b from-orange-500 to-yellow-500 rounded-full"></div>
        <h2 className="text-xl font-bold font-mono text-deepteal dark:text-tcream">Announcements</h2>
        <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
          <span className="text-orange-400 text-xs font-mono animate-pulse">PINNED</span>
        </div>
      </div>
      
      {postsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border border-yellow-500/10 rounded-full animate-ping"></div>
          </div>
          <span className="ml-3 text-orange-400 font-mono text-sm">Loading announcements...</span>
        </div>
      ) : postsErr ? (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border border-red-500 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-xs">!</span>
            </div>
            <span className="text-red-400 font-mono text-sm">{postsErr.message}</span>
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <span className="text-sm font-mono text-sage dark:text-mint">No announcements available</span>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((p: any, index: number) => (
            <Link key={p.id} to={`/post/${p.id}`} className="block group">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500/5 via-yellow-500/10 to-orange-500/5 dark:from-orange-500/10 dark:via-yellow-500/5 dark:to-orange-500/10 backdrop-blur-lg border border-orange-500/20 dark:border-yellow-500/10 hover:border-orange-500/40 dark:hover:border-yellow-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                   style={{ animationDelay: `${index * 100}ms` }}>
                
                {/* Pin badge */}
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                  📌
                </div>
                
                {/* Background effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-yellow-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative p-4">
                  <div className="flex items-start justify-between pr-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="font-bold font-mono text-deepteal dark:text-tcream text-sm line-clamp-2 group-hover:text-orange-500 dark:group-hover:text-yellow-400 transition-colors duration-200">
                          {p.title}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-orange-400 dark:text-yellow-400">
                        📅 {new Date(p.created_at).toLocaleDateString()} • 📍 {p.communities?.name || "Community"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status bar */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-orange-500/10 dark:border-yellow-500/10">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-orange-400/60 dark:text-yellow-400/60">
                        ANNOUNCEMENT #{p.id.toString().padStart(4, '0')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-mono text-orange-400">OFFICIAL</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  </div>
</div>
  );
};

export default ExplorePage;
