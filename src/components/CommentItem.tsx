import { useState } from "react";
import type { Comment } from "./CommentSection";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  comment: Comment & {
    children?: Comment[];
  };
  postId: number;
}

const createReply = async (
  replyContent: string,
  postId: number,
  parentCommentId: number,
  userId?: string,
  author?: string
) => {
  if (!userId || !author) {
    throw new Error("You must be logged in to reply.");
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: replyContent,
    parent_comment_id: parentCommentId,
    user_id: userId,
    author: author,
  });

  if (error) throw new Error(error.message);
};

export const CommentItem = ({ comment, postId }: Props) => {
  const [showReply, setShowReply] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, isSuccess } = useMutation({
    mutationFn: (replyContent: string) =>
      createReply(
        replyContent,
        postId,
        comment.id,
        user?.id,
        user?.user_metadata?.user_name
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setReplyText("");
      setShowReply(false);
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    mutate(replyText);
  };

  const isOwnComment = comment.user_id === user?.id;
  const hasReplies = comment.children && comment.children.length > 0;
  const replyCount = comment.children?.length || 0;

  return (
    <div className="group relative">
      {/* Connection line */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-mint/30 via-sage/20 to-transparent rounded-full"></div>
      
      <div className="pl-6 pb-4">
        {/* Main comment card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-tcream/5 via-mint/8 to-sage/5 dark:from-deepteal/15 dark:via-mediumteal/8 dark:to-sage/5 backdrop-blur-md border border-mint/20 dark:border-sage/15 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-mediumteal/30">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sage/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Corner accent for own comments */}
          {isOwnComment && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal/20 to-transparent rounded-bl-2xl"></div>
          )}
          
          <div className="relative p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="relative">
                  {isOwnComment && user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover border-2 border-teal/30 shadow-md"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sage to-mint shadow-md"></div>
                  )}
                  
                  {/* Status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-tcream dark:border-deepteal">
                    <div className={`w-full h-full rounded-full ${isOwnComment ? 'bg-teal' : 'bg-sage'}`}></div>
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-mono font-medium ${isOwnComment ? 'text-teal' : 'text-mediumteal dark:text-mint'}`}>
                      {comment.author}
                    </span>
                    {isOwnComment && (
                      <div className="px-1.5 py-0.5 bg-teal/10 border border-teal/20 rounded text-xs font-mono text-teal">
                        You
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 text-xs font-mono text-sage dark:text-mint">
                    <div className="w-1 h-1 bg-sage/60 rounded-full"></div>
                    <span>
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reply count badge */}
              {hasReplies && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-mint/10 dark:bg-sage/10 border border-mint/20 dark:border-sage/20 rounded-lg">
                  <svg className="w-3 h-3 text-mediumteal dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs font-mono text-mediumteal dark:text-sage">
                    {replyCount}
                  </span>
                </div>
              )}
            </div>

            {/* Comment content */}
            <div className="pl-11">
              <p className="text-deepteal dark:text-tcream leading-relaxed font-light">
                {comment.content}
              </p>
            </div>

            {/* Actions */}
            <div className="pl-11 flex items-center space-x-4">
              <button
                onClick={() => setShowReply(!showReply)}
                className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg font-mono text-sm transition-all duration-200 ${
                  showReply
                    ? 'bg-teal/20 border border-teal/30 text-teal hover:bg-teal/30'
                    : 'bg-mint/10 dark:bg-sage/10 border border-mint/20 dark:border-sage/20 text-mediumteal dark:text-mint hover:bg-mint/20 dark:hover:bg-sage/20 hover:border-mediumteal/30'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>{showReply ? "Cancel" : "Reply"}</span>
              </button>

              {/* Collapse button for replies */}
              {hasReplies && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-sage/10 dark:bg-mint/10 border border-sage/20 dark:border-mint/20 text-sage dark:text-mint hover:bg-sage/20 dark:hover:bg-mint/20 transition-all duration-200 font-mono text-sm"
                  title={isCollapsed ? "Show replies" : "Hide replies"}
                >
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{isCollapsed ? "Show" : "Hide"} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply form */}
        {showReply && user && (
          <div className="mt-4 ml-11 space-y-4">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal/5 via-mint/8 to-sage/5 dark:from-teal/10 dark:via-mediumteal/5 dark:to-sage/5 backdrop-blur-md border border-teal/20 dark:border-teal/30 shadow-lg">
              {/* Reply form background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal/3 to-transparent"></div>
              
              <form onSubmit={handleReplySubmit} className="relative p-4 space-y-4">
                {/* Reply to indicator */}
                <div className="flex items-center space-x-2 text-sm font-mono text-mediumteal dark:text-sage">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Replying to <span className="text-teal font-medium">{comment.author}</span></span>
                </div>

                {/* Textarea */}
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 text-deepteal dark:text-tcream placeholder-mediumteal dark:placeholder-sage font-light leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-transparent shadow-lg transition-all duration-200 hover:shadow-xl resize-none"
                  placeholder="Write a thoughtful reply..."
                  rows={3}
                />

                {/* Character counter */}
                {replyText && (
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2 text-sage dark:text-mint">
                      <div className="w-1 h-1 bg-sage rounded-full"></div>
                      <span>{replyText.length}/1000 characters</span>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={isPending || !replyText.trim()}
                    className={`px-6 py-2.5 rounded-xl font-mono font-medium transition-all duration-200 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      isPending || !replyText.trim()
                        ? "opacity-60 bg-sage/50 text-tcream cursor-not-allowed" 
                        : "bg-gradient-to-r from-teal to-mediumteal text-tcream hover:from-mediumteal hover:to-teal"
                    }`}
                  >
                    {isPending && (
                      <div className="w-4 h-4 border-2 border-tcream/30 border-t-tcream rounded-full animate-spin"></div>
                    )}
                    {isPending ? "Posting..." : "Post Reply"}
                    {!isPending && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>

                  {/* Success indicator */}
                  {isSuccess && (
                    <div className="flex items-center space-x-2 text-teal">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-mono">Replied!</span>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {isError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="w-5 h-5 border-2 border-red-500 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-xs font-bold">!</span>
                    </div>
                    <p className="font-mono text-red-400 text-sm">Failed to post reply. Please try again.</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {hasReplies && !isCollapsed && (
          <div className="mt-4 ml-6 space-y-3">
            {/* Replies header */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-mint/30 to-sage/30"></div>
              <span className="px-2 py-1 bg-mint/10 dark:bg-sage/10 border border-mint/20 dark:border-sage/20 rounded-md text-xs font-mono text-mediumteal dark:text-sage">
                {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-mint/30 to-sage/30"></div>
            </div>

            {comment.children?.map((child, index) => (
              <div key={child.id || index} className="relative">
                <CommentItem comment={child} postId={postId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};