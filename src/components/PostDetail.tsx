import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Post } from "./PostList";
import { supabase } from "../supabase-client";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { useAuth } from "../context/AuthContext";

interface Props {
  postId: number;
}

interface Community {
  id: number;
  name: string;
  author: string;
}

const fetchPostById = async (id: number): Promise<Post> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Post;
};

export const PostDetail = ({ postId }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch post
  const {
    data: post,
    error: postError,
    isLoading: isPostLoading,
  } = useQuery<Post, Error>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  // Fetch community (only if post has community_id)
  const {
    data: community,
    isLoading: isCommunityLoading,
    error: communityError,
  } = useQuery<Community | null, Error>({
    queryKey: ["community_for_post", post?.community_id],
    queryFn: async () => {
      if (!post?.community_id) return null;
      const { data: communityRow, error: communityErr } = await supabase
        .from("communities")
        .select("*")
        .eq("id", post.community_id)
        .single();
      if (communityErr) throw new Error(communityErr.message);
      return communityRow;
    },
    enabled: !!post?.community_id,
  });

  const canDelete =
    !!user &&
    !!post &&
    (post.author === user.id || (!!community && community.author === user.id));

  // Mutation for deleting post
  const {
    mutate: deletePost,
    isPending: isDeleting,
    error: deleteError,
    isSuccess: isDeleted,
  } = useMutation({
    mutationFn: async () => {
      const { error: delErr } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);
      if (delErr) throw new Error(delErr.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.removeQueries({ queryKey: ["post", postId] });
    },
  });

  // Handle loading states
  if (isPostLoading || isCommunityLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8 space-y-8">
        {/* Loading header */}
        <div className="flex items-center space-x-4 animate-pulse">
          <div className="h-8 w-1 bg-gradient-to-b from-deepteal to-sage rounded-full"></div>
          <div className="h-8 w-48 bg-mint/20 rounded-lg"></div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-teal rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Loading post card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 shadow-2xl animate-pulse">
          <div className="p-8 space-y-6">
            <div className="h-12 bg-sage/20 rounded-xl w-3/4 mx-auto"></div>
            <div className="h-4 bg-mint/20 rounded w-1/2 mx-auto"></div>
            <div className="h-64 bg-sage/10 rounded-xl"></div>
            <div className="space-y-3">
              <div className="h-4 bg-mint/20 rounded w-full"></div>
              <div className="h-4 bg-mint/20 rounded w-5/6"></div>
              <div className="h-4 bg-mint/20 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle errors safely
  if (postError) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8">
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-sm font-bold">!</span>
          </div>
          <div>
            <h3 className="font-mono font-medium text-red-400">Failed to Load Post</h3>
            <p className="text-red-300 text-sm font-mono">{postError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (communityError) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8">
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-sm font-bold">!</span>
          </div>
          <div>
            <h3 className="font-mono font-medium text-red-400">Community Load Error</h3>
            <p className="text-red-300 text-sm font-mono">{communityError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8">
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-mint/20 to-sage/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-mono text-deepteal dark:text-tcream mb-2">
            Post Not Found
          </h3>
          <p className="text-mediumteal dark:text-sage text-sm">
            This post may have been deleted or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between px-8">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-1 bg-gradient-to-b from-deepteal to-sage rounded-full"></div>
          <div className="flex items-center space-x-2 text-sm font-mono text-mediumteal dark:text-sage">
            <span>Post</span>
            <div className="w-1 h-1 bg-sage rounded-full"></div>
            <span className="text-teal">#{post.id.toString().padStart(4, '0')}</span>
            {community && (
              <>
                <div className="w-1 h-1 bg-mint rounded-full"></div>
                <span className="text-mint">{community.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-teal rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Post actions */}
        <div className="flex items-center space-x-3">
          {post.is_announcement && (
            <div className="px-3 py-1.5 bg-teal/10 border border-teal/20 rounded-lg flex items-center space-x-2">
              <svg className="w-4 h-4 text-teal" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
              <span className="text-xs font-mono text-teal">Announcement</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Post Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 shadow-2xl mx-8">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-50"></div>
        
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal/20 to-transparent rounded-bl-3xl opacity-60"></div>
        
        <div className="relative p-8 space-y-8">
          {/* Post Title */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold font-mono text-deepteal dark:text-tcream leading-tight">
              {post.title}
            </h1>
            
            {/* Post Meta */}
            <div className="flex items-center justify-center space-x-4 text-sm font-mono">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-sage/10 dark:bg-mint/10 border border-sage/20 dark:border-mint/20 rounded-lg">
                <svg className="w-4 h-4 text-sage dark:text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-mediumteal dark:text-sage">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {community && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-mint/10 dark:bg-sage/10 border border-mint/20 dark:border-sage/20 rounded-lg">
                  <svg className="w-4 h-4 text-mint dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-mediumteal dark:text-sage">{community.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Post Image */}
          {post.image_url && (
            <div className="flex justify-center">
              <div className="relative group max-w-2xl">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full rounded-xl object-cover shadow-2xl border border-mint/30 dark:border-sage/30 transition-all duration-300 group-hover:shadow-3xl max-h-96"
                />
                {/* Image overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-deepteal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </div>
            </div>
          )}

          {/* Post Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-deepteal dark:text-tcream leading-relaxed font-light text-lg">
              {post.content}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-mint/20 dark:border-sage/20">
            <div className="flex items-center space-x-4">
              <LikeButton postId={postId} />
            </div>

            {/* Delete Button */}
            {canDelete && (
              <div className="flex items-center space-x-3">
                {isDeleted && (
                  <div className="flex items-center space-x-2 text-sage">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-mono">Deleted!</span>
                  </div>
                )}
                
                <button
                  onClick={() => deletePost()}
                  disabled={isDeleting}
                  className={`px-4 py-2.5 rounded-xl font-mono font-medium transition-all duration-200 inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    isDeleting
                      ? "opacity-60 bg-red-500/50 text-tcream cursor-not-allowed" 
                      : "bg-gradient-to-r from-red-500 to-red-600 text-tcream hover:from-red-600 hover:to-red-700"
                  }`}
                >
                  {isDeleting && (
                    <div className="w-4 h-4 border-2 border-tcream/30 border-t-tcream rounded-full animate-spin"></div>
                  )}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </button>
              </div>
            )}
          </div>

          {/* Delete Error */}
          {deleteError && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              <p className="font-mono text-red-400">{deleteError.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="mx-8">
        <CommentSection postId={postId} />
      </div>
    </div>
  );
};