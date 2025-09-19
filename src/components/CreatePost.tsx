import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import type { Community } from "./CommunityList";
import {fetchCommunities} from "./CommunityList";
import { useNavigate } from "react-router-dom";

interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
  author: string;
  is_announcement?: boolean;
}

const createPost = async (post: PostInput, imageFile: File | null) => {
  let imageUrl: string | null = null;
  if (imageFile) {
    const filePath = `${post.title}-${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, imageFile);
    if (uploadError) throw new Error(uploadError.message);
    const { data: publicURLData } = supabase.storage
      .from("post-images")
      .getPublicUrl(filePath);
    imageUrl = publicURLData.publicUrl;
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, image_url: imageUrl });

  if (error) throw new Error(error.message);

  return data;
};

export const CreatePost = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [isAnnouncement, setIsAnnouncement] = useState<boolean>(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: communities } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: fetchCommunities,
  });

  const { mutate, isPending, isError, isSuccess } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File | null }) => {
      return createPost(data.post, data.imageFile);
    },
  });

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => navigate("/"), 1200);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    mutate({
      post: {
        title,
        content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: communityId,
        author: user!.id,
        is_announcement: isAnnouncement && !!communityId,
      },
      imageFile: selectedFile,
    });
  };

  const handleCommunitySelect = (id: number | null) => {
    setCommunityId(id);
    setIsCommunityOpen(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-8 w-1 bg-gradient-to-b from-deepteal to-sage rounded-full"></div>
        <h1 className="text-3xl font-bold font-mono text-deepteal dark:text-tcream">
          Create Post
        </h1>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-teal rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 shadow-2xl">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-50"></div>
        
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-mediumteal/20 to-transparent rounded-bl-3xl opacity-60"></div>
        
        <div className="relative p-8 space-y-8">
          {/* Title Field */}
          <div className="space-y-3">
            <label htmlFor="title" className="flex items-center space-x-2 text-sm font-medium font-mono text-deepteal dark:text-mint">
              <div className="w-1.5 h-1.5 bg-teal rounded-full"></div>
              <span>Post Title</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 text-deepteal dark:text-tcream placeholder-mediumteal dark:placeholder-sage font-mono focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-transparent shadow-lg transition-all duration-200 hover:shadow-xl"
              placeholder="Enter your post title..."
              required
            />
          </div>

          {/* Content Field */}
          <div className="space-y-3">
            <label htmlFor="content" className="flex items-center space-x-2 text-sm font-medium font-mono text-deepteal dark:text-mint">
              <div className="w-1.5 h-1.5 bg-sage rounded-full"></div>
              <span>Content</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 text-deepteal dark:text-tcream placeholder-mediumteal dark:placeholder-sage font-light leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-transparent shadow-lg transition-all duration-200 hover:shadow-xl resize-none"
              placeholder="Share your thoughts..."
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Community Selector */}
            <div className="relative space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium font-mono text-deepteal dark:text-mint">
                <div className="w-1.5 h-1.5 bg-mediumteal rounded-full"></div>
                <span>Community</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCommunityOpen((v) => !v)}
                className={`w-full px-4 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 text-left flex items-center justify-between gap-3 shadow-lg hover:shadow-xl font-mono
                  ${isCommunityOpen 
                    ? "border-teal/50 ring-2 ring-teal/30 bg-teal/10" 
                    : "border-mint/30 dark:border-sage/20 bg-tcream/10 dark:bg-deepteal/30 hover:border-mediumteal/40"
                  }`}
              >
                <span className="text-deepteal dark:text-tcream">
                  {communityId
                    ? communities?.find((c) => c.id === communityId)?.name || "Choose Community"
                    : "-- Select Community --"}
                </span>
                <svg className={`w-5 h-5 ${isCommunityOpen ? "rotate-180" : "rotate-0"} transition-transform text-teal`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>
              {isCommunityOpen && (
                <div className="absolute z-30 mt-2 w-full rounded-xl border border-teal/40 bg-tcream/95 dark:bg-deepteal/95 backdrop-blur-lg shadow-2xl max-h-64 overflow-auto">
                  <button
                    type="button"
                    onClick={() => handleCommunitySelect(null)}
                    className="w-full text-left px-4 py-3 text-sm font-mono hover:bg-mint/20 dark:hover:bg-sage/20 text-mediumteal dark:text-mint transition-colors"
                  >
                    -- Select Community --
                  </button>
                  {communities?.map((community) => (
                    <button
                      key={community.id}
                      type="button"
                      onClick={() => handleCommunitySelect(community.id)}
                      className={`w-full text-left px-4 py-3 text-sm font-mono hover:bg-mint/20 dark:hover:bg-sage/20 transition-colors
                        ${communityId === community.id 
                          ? "bg-teal/20 text-deepteal dark:text-tcream font-medium" 
                          : "text-mediumteal dark:text-mint"
                        }`}
                    >
                      {community.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <label htmlFor="image" className="flex items-center space-x-2 text-sm font-medium font-mono text-deepteal dark:text-mint">
                <div className="w-1.5 h-1.5 bg-sage rounded-full"></div>
                <span>Attach Image</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label 
                  htmlFor="image"
                  className="w-full px-4 py-3 rounded-xl bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 text-deepteal dark:text-tcream font-mono cursor-pointer flex items-center justify-center space-x-3 hover:border-mediumteal/40 transition-all duration-200 shadow-lg hover:shadow-xl group"
                >
                  <svg className="w-5 h-5 text-teal group-hover:text-mediumteal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm">
                    {selectedFile ? selectedFile.name : "Choose file..."}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Admin Announcement Toggle */}
          {communityId && (
            <div className="pt-4 border-t border-mint/20 dark:border-sage/20">
              <AdminAnnouncementToggle communityId={communityId} value={isAnnouncement} onChange={setIsAnnouncement} />
            </div>
          )}

          {/* Submit Section */}
          <div className="flex items-center justify-between pt-6 border-t border-mint/20 dark:border-sage/20">
            <button
              type="submit"
              disabled={!user || isPending}
              className={`px-8 py-3 rounded-xl font-mono font-medium transition-all duration-200 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                !user || isPending 
                  ? "opacity-60 bg-sage/50 text-tcream cursor-not-allowed" 
                  : "bg-gradient-to-r from-teal to-mediumteal text-tcream hover:from-mediumteal hover:to-teal"
              }`}
              title={!user ? "Please login to create a post" : undefined}
            >
              {isPending && (
                <div className="w-5 h-5 border-2 border-tcream/30 border-t-tcream rounded-full animate-spin"></div>
              )}
              {isPending ? "Creating..." : "Create Post"}
              {!isPending && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>

            {!user && (
              <div className="flex items-center space-x-2 bg-mint/10 border border-mint/20 rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-mono text-mediumteal">Login required to post</span>
              </div>
            )}
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-center gap-3 bg-teal/10 border border-teal/30 rounded-xl p-4 mt-4">
              <div className="w-6 h-6 bg-teal rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-tcream" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-mono font-medium text-deepteal dark:text-tcream">Post Created!</p>
                <p className="text-sm text-mediumteal dark:text-mint">Redirecting to home...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-4">
              <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              <p className="font-mono text-red-400">Failed to create post. Please try again.</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

interface AdminAnnouncementToggleProps {
  communityId: number;
  value: boolean;
  onChange: (v: boolean) => void;
}

const AdminAnnouncementToggle = ({ communityId, value, onChange }: AdminAnnouncementToggleProps) => {
  const { user } = useAuth();

  const { data: community, isLoading } = useQuery<Community | null, Error>({
    queryKey: ["community", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("id", communityId)
        .single();
      if (error) throw new Error(error.message);
      return data as Community;
    },
    enabled: !!communityId,
  });

  const isAdmin = !!user && !!community && (community as any).author === user.id;

  return (
    <div className="flex items-center space-x-4 p-4 rounded-xl bg-mint/5 dark:bg-sage/5 border border-mint/20 dark:border-sage/20">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <input
            id="is_announcement"
            type="checkbox"
            className="sr-only"
            checked={value && isAdmin}
            onChange={(e) => onChange(e.target.checked)}
            disabled={!isAdmin}
          />
          <label
            htmlFor="is_announcement"
            className={`relative flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200 cursor-pointer
              ${value && isAdmin 
                ? "bg-teal border-teal" 
                : "bg-transparent border-mint/40 dark:border-sage/40 hover:border-teal/60"
              }
              ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {value && isAdmin && (
              <svg className="w-3 h-3 text-tcream" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className={`font-mono text-sm ${value && isAdmin ? "font-medium text-deepteal dark:text-tcream" : "text-mediumteal dark:text-mint"} ${!isAdmin ? "opacity-60" : ""}`}>
            Community Announcement
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-xs font-mono">
        {isLoading && (
          <div className="flex items-center space-x-1 text-sage">
            <div className="w-3 h-3 border border-sage border-t-transparent rounded-full animate-spin"></div>
            <span>Checking permissions...</span>
          </div>
        )}
        {!isLoading && !isAdmin && (
          <span className="px-2 py-1 bg-mint/10 border border-mint/20 rounded-md text-mediumteal">
            Admin Only
          </span>
        )}
        {!isLoading && isAdmin && (
          <span className="px-2 py-1 bg-teal/10 border border-teal/20 rounded-md text-teal">
            Admin Access
          </span>
        )}
      </div>
    </div>
  );
};