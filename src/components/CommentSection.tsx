import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { CommentItem } from "./CommentItem";

interface Props {
  postId: number;
}

interface NewComment {
  content: string;
  parent_comment_id?: number | null;
}

export interface Comment {
  id: number;
  post_id: number;
  parent_comment_id: number | null;
  content: string;
  user_id: string;
  created_at: string;
  author: string;
}

const createComment = async (
  newComment: NewComment,
  postId: number,
  userId?: string,
  author?: string
) => {
  if (!userId || !author) {
    throw new Error("You must be logged in to comment.");
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: newComment.content,
    parent_comment_id: newComment.parent_comment_id || null,
    user_id: userId,
    author: author,
  });

  if (error) throw new Error(error.message);
};

const fetchComments = async (postId: number): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Comment[];
};

export const CommentSection = ({ postId }: Props) => {
  const [newCommentText, setNewCommentText] = useState<string>("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: comments,
    isLoading,
    error,
  } = useQuery<Comment[], Error>({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    refetchInterval: 5000,
  });

  const { mutate, isPending, isError, isSuccess } = useMutation({
    mutationFn: (newComment: NewComment) =>
      createComment(
        newComment,
        postId,
        user?.id,
        user?.user_metadata?.user_name
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    mutate({ content: newCommentText, parent_comment_id: null });
    setNewCommentText("");
  };

  /* Map of Comments - Organize Replies - Return Tree  */
  const buildCommentTree = (
    flatComments: Comment[]
  ): (Comment & { children?: Comment[] })[] => {
    const map = new Map<number, Comment & { children?: Comment[] }>();
    const roots: (Comment & { children?: Comment[] })[] = [];

    flatComments.forEach((comment) => {
      map.set(comment.id, { ...comment, children: [] });
    });

    flatComments.forEach((comment) => {
      if (comment.parent_comment_id) {
        const parent = map.get(comment.parent_comment_id);
        if (parent) {
          parent.children!.push(map.get(comment.id)!);
        }
      } else {
        roots.push(map.get(comment.id)!);
      }
    });

    return roots;
  };

  const commentTree = comments ? buildCommentTree(comments) : [];
  const totalComments = comments?.length || 0;
  const rootComments = commentTree.length;

  if (isLoading) {
    return (
      <div className="mt-8 space-y-6">
        {/* Loading header */}
        <div className="flex items-center space-x-4">
          <div className="h-8 w-1 bg-gradient-to-b from-deepteal to-sage rounded-full animate-pulse"></div>
          <div className="h-8 w-32 bg-mint/20 rounded-lg animate-pulse"></div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-teal rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Loading comments */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl bg-gradient-to-br from-tcream/5 via-mint/8 to-sage/5 dark:from-deepteal/15 dark:via-mediumteal/8 dark:to-sage/5 backdrop-blur-md border border-mint/20 dark:border-sage/15 p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-sage/30 rounded-full"></div>
                <div className="h-4 bg-mint/30 rounded w-24"></div>
                <div className="h-3 bg-sage/20 rounded w-16"></div>
              </div>
              <div className="space-y-2 ml-11">
                <div className="h-4 bg-sage/20 rounded w-3/4"></div>
                <div className="h-4 bg-sage/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-sm font-bold">!</span>
          </div>
          <div>
            <h3 className="font-mono font-medium text-red-400">Failed to Load Comments</h3>
            <p className="text-red-300 text-sm font-mono">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-1 bg-gradient-to-b from-deepteal to-sage rounded-full"></div>
          <h3 className="text-2xl font-bold font-mono text-deepteal dark:text-tcream">
            Discussion
          </h3>
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 bg-teal/10 border border-teal/20 rounded-full">
              <span className="text-teal text-sm font-mono">{totalComments}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-teal rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-mint/10 dark:bg-sage/10 border border-mint/20 dark:border-sage/20 rounded-lg">
          <div className="w-2 h-2 bg-sage rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-mediumteal dark:text-sage">Live Updates</span>
        </div>
      </div>

      {/* Comment Form */}
      {user ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 shadow-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-50"></div>
          
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal/20 to-transparent rounded-bl-2xl opacity-60"></div>
          
          <form onSubmit={handleSubmit} className="relative p-6 space-y-4">
            {/* Form header */}
            <div className="flex items-center space-x-3 mb-4">
              {/* User avatar */}
              <div className="relative">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-teal/30 shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal to-mediumteal shadow-md"></div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal rounded-full border-2 border-tcream dark:border-deepteal flex items-center justify-center">
                  <svg className="w-2 h-2 text-tcream dark:text-deepteal" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>

              <div>
                <p className="font-mono font-medium text-deepteal dark:text-tcream">
                  {user.user_metadata?.user_name || 'Anonymous'}
                </p>
                <p className="text-xs font-mono text-mediumteal dark:text-sage">
                  Share your thoughts on this post
                </p>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 text-deepteal dark:text-tcream placeholder-mediumteal dark:placeholder-sage font-light leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-transparent shadow-lg transition-all duration-200 hover:shadow-xl resize-none"
              placeholder="Join the conversation..."
              rows={4}
            />

            {/* Character counter and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {newCommentText && (
                  <div className="flex items-center space-x-2 text-xs font-mono text-sage dark:text-mint">
                    <div className="w-1 h-1 bg-sage rounded-full"></div>
                    <span>{newCommentText.length}/2000 characters</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending || !newCommentText.trim()}
                className={`px-6 py-2.5 rounded-xl font-mono font-medium transition-all duration-200 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                  isPending || !newCommentText.trim()
                    ? "opacity-60 bg-sage/50 text-tcream cursor-not-allowed" 
                    : "bg-gradient-to-r from-teal to-mediumteal text-tcream hover:from-mediumteal hover:to-teal"
                }`}
              >
                {isPending && (
                  <div className="w-4 h-4 border-2 border-tcream/30 border-t-tcream rounded-full animate-spin"></div>
                )}
                {isPending ? "Posting..." : "Post Comment"}
                {!isPending && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Success message */}
            {isSuccess && (
              <div className="flex items-center gap-2 text-teal text-sm font-mono">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Comment posted!</span>
              </div>
            )}

            {/* Error message */}
            {isError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="w-5 h-5 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <span className="text-red-500 text-xs font-bold">!</span>
                </div>
                <p className="font-mono text-red-400 text-sm">Failed to post comment. Please try again.</p>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-mint/5 via-sage/8 to-tcream/5 dark:from-sage/10 dark:via-mint/8 dark:to-deepteal/5 backdrop-blur-lg border border-mint/20 dark:border-sage/15 shadow-lg p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-mint/3 to-transparent opacity-50"></div>
          
          <div className="relative flex items-center justify-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-mint/20 to-sage/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-mono font-medium text-deepteal dark:text-tcream mb-1">
                Join the Discussion
              </p>
              <p className="text-sm text-mediumteal dark:text-sage">
                Login to share your thoughts and engage with the community
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      {commentTree.length > 0 ? (
        <div className="space-y-6">
          {/* Comments header */}
          <div className="flex items-center space-x-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-mint/30 to-sage/30"></div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-mint/10 dark:bg-sage/10 border border-mint/20 dark:border-sage/20 rounded-lg">
              <svg className="w-4 h-4 text-mediumteal dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-mono text-mediumteal dark:text-sage">
                {rootComments} {rootComments === 1 ? 'Thread' : 'Threads'}
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-mint/30 to-sage/30"></div>
          </div>

          {/* Comment threads */}
          <div className="space-y-6">
            {commentTree.map((comment, index) => (
              <div 
                key={comment.id || index} 
                className="relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CommentItem comment={comment} postId={postId} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-mint/20 to-sage/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-mono text-deepteal dark:text-tcream mb-2">
            No Comments Yet
          </h3>
          <p className="text-mediumteal dark:text-sage text-sm">
            Be the first to start the conversation!
          </p>
        </div>
      )}
    </div>
  );
};