import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { PostItem } from "../components/PostItem";
import type { Post } from "../components/PostList";

interface UserStats {
  postCount: number;
  communityCount: number;
  communityPostCount: number;
}

const fetchUserStats = async (userId: string): Promise<UserStats> => {
  const [{ count: postCount, error: postErr }, { count: communityCount, error: commErr }] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author", userId),
    supabase.from("communities").select("id", { count: "exact", head: true }).eq("author", userId),
  ]);
  if (postErr) throw new Error(postErr.message);
  if (commErr) throw new Error(commErr.message);

  // Count posts inside the user's communities
  const { data: userCommunities, error: listCommErr } = await supabase
    .from("communities")
    .select("id")
    .eq("author", userId);
  if (listCommErr) throw new Error(listCommErr.message);
  const communityIds = (userCommunities || []).map((c) => c.id);
  let communityPostCount = 0;
  if (communityIds.length > 0) {
    const { count, error: postsInCommsErr } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .in("community_id", communityIds);
    if (postsInCommsErr) throw new Error(postsInCommsErr.message);
    communityPostCount = count || 0;
  }

  return {
    postCount: postCount || 0,
    communityCount: communityCount || 0,
    communityPostCount,
  };
};

const deleteUserContent = async (userId: string) => {
  // 1) Load communities authored by the user
  const { data: communities, error: commErr } = await supabase
    .from("communities")
    .select("id")
    .eq("author", userId);
  if (commErr) throw new Error(commErr.message);
  const communityIds = (communities || []).map((c) => c.id);

  // 2) Delete posts inside those communities
  if (communityIds.length > 0) {
    const { error: delPostsInCommsErr } = await supabase
      .from("posts")
      .delete()
      .in("community_id", communityIds);
    if (delPostsInCommsErr) throw new Error(delPostsInCommsErr.message);
  }

  // 3) Delete the communities themselves
  if (communityIds.length > 0) {
    const { error: delCommsErr } = await supabase
      .from("communities")
      .delete()
      .in("id", communityIds);
    if (delCommsErr) throw new Error(delCommsErr.message);
  }

  const { error: delUserPostsErr } = await supabase
    .from("posts")
    .delete()
    .eq("author", userId);
  if (delUserPostsErr) throw new Error(delUserPostsErr.message);
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [activeSection, setActiveSection] = useState<"none" | "userPosts" | "userCommunities" | "postsInUserCommunities">("none");

  const { data: stats, isLoading, error, refetch } = useQuery<UserStats, Error>({
    queryKey: ["userStats", userId],
    queryFn: () => fetchUserStats(userId as string),
    enabled: !!userId,
  });

  const displayName = useMemo(() => user?.user_metadata?.user_name || user?.email || "User", [user]);
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const { mutate: removeContent, isPending: isDeleting, error: deleteErr } = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const confirmation = window.confirm(
        "This will permanently delete your posts, your communities, and posts within those communities. Continue?"
      );
      if (!confirmation) return;
      await deleteUserContent(userId);
    },
    onSuccess: async () => {
      await refetch();
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-mint/20 via-sage/20 to-mediumteal/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-mono text-deepteal dark:text-tcream mb-2">Authentication Required</h3>
            <p className="text-sage dark:text-mint">Please sign in to view your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-mint/20 border-t-mediumteal rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-2 border-sage/10 rounded-full animate-ping"></div>
        </div>
        <span className="ml-6 text-deepteal dark:text-tcream font-mono text-base">
          Loading dashboard<span className="animate-pulse">...</span>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-8 max-w-lg">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-sm">!</span>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold font-mono">Dashboard Load Error</h3>
              <p className="text-red-300 text-sm font-mono mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tcream/10 via-mint/15 to-sage/10 dark:from-deepteal/20 dark:via-mediumteal/15 dark:to-sage/10 backdrop-blur-xl border border-mint/20 dark:border-sage/10 shadow-2xl">
        
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/5 via-sage/10 to-mint/5 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-mediumteal/20 to-transparent rounded-bl-full"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex items-center space-x-6 mb-6">
            {/* Dashboard Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mediumteal to-sage shadow-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" strokeWidth="2" rx="1" />
                <rect x="14" y="3" width="7" height="7" strokeWidth="2" rx="1" />
                <rect x="14" y="14" width="7" height="7" strokeWidth="2" rx="1" />
                <rect x="3" y="14" width="7" height="7" strokeWidth="2" rx="1" />
              </svg>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-sm font-mono text-green-400">ONLINE</span>
              </div>
              
              <div className="h-4 w-px bg-gradient-to-b from-transparent via-sage/50 to-transparent"></div>
              
              <div className="flex items-center space-x-1">
                <span className="text-sm font-mono text-sage dark:text-mint">UID:</span>
                <span className="text-sm font-mono text-mediumteal">{user.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
          
          {/* Title and User Info */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold font-mono bg-gradient-to-r from-tcream via-mediumteal to-sage bg-clip-text text-transparent">
              Your Dashboard
            </h1>
            
            {/* User Profile Card */}
            <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-tcream/10 via-mint/5 to-sage/10 dark:from-deepteal/10 dark:via-teal/5 dark:to-sage/10 backdrop-blur-md rounded-2xl border border-mint/20 dark:border-sage/10">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover ring-4 ring-mint/30 dark:ring-sage/20 shadow-lg" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mediumteal to-sage shadow-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold font-mono text-deepteal dark:text-tcream">{displayName}</div>
                <div className="text-sm font-mono text-sage dark:text-mint">{user.email}</div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-mono text-blue-400">VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scan line effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mediumteal/60 to-transparent"></div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 hover:border-mediumteal/40 dark:hover:border-mediumteal/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-left p-6"
          onClick={() => setActiveSection((s) => (s === "userPosts" ? "none" : "userPosts"))}
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-mediumteal/20 to-transparent rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-sage dark:text-mint">Your Posts</span>
              </div>
              <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <div className="text-4xl font-bold font-mono text-deepteal dark:text-tcream mb-2">
              {stats?.postCount ?? 0}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-mediumteal dark:text-sage">
                {activeSection === "userPosts" ? "Hide Details" : "View Posts"}
              </span>
              <div className={`transform transition-transform duration-200 ${activeSection === "userPosts" ? "rotate-180" : ""}`}>
                <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </button>

        <button
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-mint/5 via-sage/10 to-mediumteal/5 dark:from-sage/10 dark:via-mint/5 dark:to-mediumteal/10 backdrop-blur-lg border border-sage/20 dark:border-mint/10 hover:border-sage/40 dark:hover:border-mint/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-left p-6"
          onClick={() => setActiveSection((s) => (s === "userCommunities" ? "none" : "userCommunities"))}
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-sage/0 via-mint/5 to-mediumteal/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-sage/20 to-transparent rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-sage dark:text-mint">Communities Created</span>
              </div>
              <svg className="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
              </svg>
            </div>
            
            <div className="text-4xl font-bold font-mono text-deepteal dark:text-tcream mb-2">
              {stats?.communityCount ?? 0}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-sage dark:text-mint">
                {activeSection === "userCommunities" ? "Hide Details" : "View Communities"}
              </span>
              <div className={`transform transition-transform duration-200 ${activeSection === "userCommunities" ? "rotate-180" : ""}`}>
                <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </button>

        <button
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sage/5 via-mediumteal/10 to-mint/5 dark:from-mediumteal/10 dark:via-sage/5 dark:to-mint/10 backdrop-blur-lg border border-mediumteal/20 dark:border-sage/10 hover:border-mediumteal/40 dark:hover:border-sage/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-left p-6"
          onClick={() => setActiveSection((s) => (s === "postsInUserCommunities" ? "none" : "postsInUserCommunities"))}
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal/20 to-transparent rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-sage dark:text-mint">Posts In Your Communities</span>
              </div>
              <svg className="w-5 h-5 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            
            <div className="text-4xl font-bold font-mono text-deepteal dark:text-tcream mb-2">
              {stats?.communityPostCount ?? 0}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-mediumteal dark:text-sage">
                {activeSection === "postsInUserCommunities" ? "Hide Details" : "View Posts"}
              </span>
              <div className={`transform transition-transform duration-200 ${activeSection === "postsInUserCommunities" ? "rotate-180" : ""}`}>
                <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => navigate("/create")}
          className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-mediumteal/80 to-sage/80 hover:from-mediumteal hover:to-sage backdrop-blur-md text-white font-mono font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Post</span>
        </button>
        
        <button
          onClick={() => removeContent()}
          disabled={isDeleting}
          className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 backdrop-blur-md text-white font-mono font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete My Content</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {deleteErr && (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-xs">!</span>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold font-mono">Delete Operation Failed</h3>
              <p className="text-red-300 text-sm font-mono">{deleteErr.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Content Sections */}
      {activeSection === "userPosts" && (
        <UserPostsList userId={userId as string} />
      )}

      {activeSection === "userCommunities" && (
        <UserCommunitiesList userId={userId as string} />
      )}

      {activeSection === "postsInUserCommunities" && (
        <PostsInUserCommunitiesList userId={userId as string} />
      )}
    </div>
  );
};

export default Dashboard;

const UserPostsList = ({ userId }: { userId: string }) => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const { data, isLoading, error } = useQuery<Post[], Error>({
    queryKey: ["userPosts", userId],
    queryFn: async () => {
      const [{ data: countsData, error: countsErr }, { data: baseData, error: baseErr }] = await Promise.all([
        supabase.rpc("get_posts_with_counts"),
        supabase
          .from("posts")
          .select("id,title,content,created_at,image_url,avatar_url,is_announcement,author,community_id")
          .eq("author", userId)
          .order("created_at", { ascending: false }),
      ]);
      if (countsErr) throw new Error(countsErr.message);
      if (baseErr) throw new Error(baseErr.message);
      const countsById = new Map<number, any>(
        ((countsData as any[]) || []).map((p) => [p.id as number, p])
      );
      const merged: Post[] = ((baseData as any[]) || []).map((p: any) => {
        const c = countsById.get(p.id) || {};
        return {
          ...p,
          like_count: c.like_count ?? 0,
          comment_count: c.comment_count ?? 0,
        } as Post;
      });
      return merged;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-mint/20 border-t-mediumteal rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-sage/10 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-deepteal dark:text-tcream font-mono text-sm">
          Loading your posts<span className="animate-pulse">...</span>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-xs">!</span>
          </div>
          <span className="text-red-400 font-mono text-sm">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-mint/20 via-sage/20 to-mediumteal/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-sage dark:text-mint font-mono">You have no posts yet</span>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-1 bg-gradient-to-b from-mediumteal to-sage rounded-full"></div>
          <h3 className="text-xl font-bold font-mono text-deepteal dark:text-tcream">Your Posts</h3>
        </div>
        
        <div className="relative">
          <label className="mr-3 text-sm font-mono text-sage dark:text-mint">Sort by</label>
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {sorted.map((p, index) => (
          <div 
            key={p.id}
            className="transform hover:scale-105 transition-all duration-200"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <PostItem post={p} />
          </div>
        ))}
      </div>
    </div>
  );
};

const UserCommunitiesList = ({ userId }: { userId: string }) => {
  const { data, isLoading, error } = useQuery<any[], Error>({
    queryKey: ["userCommunities", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("id, name, description, created_at")
        .eq("author", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      // Fetch post counts
      const { data: posts, error: postsErr } = await supabase
        .from("posts")
        .select("id,community_id");
      if (postsErr) throw new Error(postsErr.message);
      const counts = new Map<number, number>();
      (posts || []).forEach((p: any) => {
        if (p.community_id != null) {
          const cid = p.community_id as number;
          counts.set(cid, (counts.get(cid) || 0) + 1);
        }
      });
      return (data || []).map((c: any) => ({ ...c, post_count: counts.get(c.id) || 0 }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-sage/20 border-t-mint rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-mediumteal/10 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-deepteal dark:text-tcream font-mono text-sm">
          Loading your communities<span className="animate-pulse">...</span>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-xs">!</span>
          </div>
          <span className="text-red-400 font-mono text-sm">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-sage/20 via-mint/20 to-mediumteal/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
          </svg>
        </div>
        <span className="text-sage dark:text-mint font-mono">You haven't created any communities yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="h-6 w-1 bg-gradient-to-b from-sage to-mint rounded-full"></div>
        <h3 className="text-xl font-bold font-mono text-deepteal dark:text-tcream">Your Communities</h3>
      </div>
      
      <div className="space-y-4">
        {data.map((c: any, index: number) => (
          <div key={c.id} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-sage/5 via-mint/10 to-mediumteal/5 dark:from-sage/10 dark:via-mint/5 dark:to-mediumteal/10 backdrop-blur-lg border border-sage/20 dark:border-mint/10 hover:border-sage/40 dark:hover:border-mint/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
               style={{ animationDelay: `${index * 100}ms` }}>
            
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-sage/0 via-mint/5 to-teal/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-sage/20 to-transparent rounded-bl-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse"></div>
                    <Link to={`/community/${c.id}`} className="font-bold font-mono text-deepteal dark:text-tcream text-sm group-hover:text-sage dark:group-hover:text-mint transition-colors duration-200 hover:underline">
                      {c.name}
                    </Link>
                  </div>
                  {c.description && (
                    <p className="text-xs text-teal dark:text-sage leading-relaxed line-clamp-2 font-light mb-2">
                      {c.description}
                    </p>
                  )}
                  <div className="text-xs font-mono text-sage/60 dark:text-mint/60">
                    Created: {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 px-3 py-1 bg-mint/10 dark:bg-sage/10 rounded-full ml-4">
                  <span className="text-xs font-mono text-sage dark:text-mint">{c.post_count ?? 0}</span>
                  <span className="text-xs text-sage/60 dark:text-mint/60">posts</span>
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
    </div>
  );
};

const PostsInUserCommunitiesList = ({ userId }: { userId: string }) => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const { data, isLoading, error } = useQuery<Post[], Error>({
    queryKey: ["postsInUserCommunities", userId],
    queryFn: async () => {
      const { data: comms, error: commErr } = await supabase
        .from("communities")
        .select("id")
        .eq("author", userId);
      if (commErr) throw new Error(commErr.message);
      const ids = (comms || []).map((c) => c.id);
      if (ids.length === 0) return [] as Post[];
      const [{ data: countsData, error: countsErr }, { data: baseData, error: baseErr }] = await Promise.all([
        supabase.rpc("get_posts_with_counts"),
        supabase
          .from("posts")
          .select("id,title,content,created_at,image_url,avatar_url,is_announcement,author,community_id")
          .in("community_id", ids)
          .order("created_at", { ascending: false }),
      ]);
      if (countsErr) throw new Error(countsErr.message);
      if (baseErr) throw new Error(baseErr.message);
      const countsById = new Map<number, any>(
        ((countsData as any[]) || []).map((p) => [p.id as number, p])
      );
      const merged: Post[] = ((baseData as any[]) || []).map((p: any) => {
        const c = countsById.get(p.id) || {};
        return {
          ...p,
          like_count: c.like_count ?? 0,
          comment_count: c.comment_count ?? 0,
        } as Post;
      });
      return merged;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-mediumteal/20 border-t-sage rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-mint/10 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-deepteal dark:text-tcream font-mono text-sm">
          Loading community posts<span className="animate-pulse">...</span>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-lg rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-xs">!</span>
          </div>
          <span className="text-red-400 font-mono text-sm">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-mediumteal/20 via-sage/20 to-mint/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <span className="text-sage dark:text-mint font-mono">Your communities have no posts yet</span>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-1 bg-gradient-to-b from-mediumteal to-mint rounded-full"></div>
          <h3 className="text-xl font-bold font-mono text-deepteal dark:text-tcream">Posts in Your Communities</h3>
        </div>
        
        <div className="relative">
          <label className="mr-3 text-sm font-mono text-sage dark:text-mint">Sort by</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="appearance-none bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 rounded-xl px-4 py-2 pr-10 text-deep-teal dark:text-cream text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-200"
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {sorted.map((p, index) => (
          <div 
            key={p.id}
            className="transform hover:scale-105 transition-all duration-200"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <PostItem post={p} />
          </div>
        ))}
      </div>
    </div>
  );
};