import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";

interface CommunityInput {
  name: string;
  description: string;
  author: string;
}

const createCommunity = async (community: CommunityInput) => {
  const { error, data } = await supabase.from("communities").insert(community);

  if (error) throw new Error(error.message);
  return data;
};

export const CreateCommunity = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { mutate, isPending, isError, isSuccess } = useMutation({
    mutationFn: createCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      setTimeout(() => navigate("/communities"), 1000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    mutate({ name, description, author: user.id });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-8 w-1 bg-gradient-to-b from-deepteal to-sage rounded-full"></div>
        <h1 className="text-3xl font-bold font-mono text-deepteal dark:text-tcream">
          Create Community
        </h1>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-sage rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-mint rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 shadow-2xl">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-50"></div>
        
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sage/20 to-transparent rounded-bl-3xl opacity-60"></div>
        
        <div className="relative p-8 space-y-8">
          {/* Community Icon Section */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-mint/20 to-sage/20 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {/* Orbital rings */}
              <div className="absolute inset-0 border-2 border-mint/20 rounded-2xl animate-pulse"></div>
              <div className="absolute -inset-2 border border-sage/10 rounded-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>

          {/* Community Name Field */}
          <div className="space-y-3">
            <label htmlFor="name" className="flex items-center space-x-2 text-sm font-medium font-mono text-deepteal dark:text-mint">
              <div className="w-1.5 h-1.5 bg-teal rounded-full"></div>
              <span>Community Name</span>
              <div className="px-2 py-0.5 bg-teal/10 border border-teal/20 rounded-md text-xs text-teal">Required</div>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 text-deepteal dark:text-tcream placeholder-mediumteal dark:placeholder-sage font-mono focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-transparent shadow-lg transition-all duration-200 hover:shadow-xl"
              placeholder="Enter a unique community name..."
              required
            />
            {name && (
              <div className="flex items-center space-x-2 text-xs font-mono">
                <div className="w-1 h-1 bg-teal rounded-full"></div>
                <span className="text-teal">
                  {name.length}/50 characters
                </span>
              </div>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-3">
            <label htmlFor="description" className="flex items-center space-x-2 text-sm font-medium font-mono text-deepteal dark:text-mint">
              <div className="w-1.5 h-1.5 bg-sage rounded-full"></div>
              <span>Community Description</span>
              <div className="px-2 py-0.5 bg-sage/10 border border-sage/20 rounded-md text-xs text-sage">Optional</div>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 text-deepteal dark:text-tcream placeholder-mediumteal dark:placeholder-sage font-light leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-transparent shadow-lg transition-all duration-200 hover:shadow-xl resize-none"
              placeholder="Describe what your community is about..."
              rows={4}
            />
            {description && (
              <div className="flex items-center space-x-2 text-xs font-mono">
                <div className="w-1 h-1 bg-sage rounded-full"></div>
                <span className="text-sage">
                  {description.length}/500 characters
                </span>
              </div>
            )}
          </div>

          {/* Community Guidelines Preview */}
          {(name || description) && (
            <div className="p-6 rounded-xl bg-mint/5 dark:bg-sage/5 border border-mint/20 dark:border-sage/20 space-y-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 className="font-mono font-medium text-deepteal dark:text-tcream">Community Preview</h3>
              </div>
              
              <div className="space-y-3">
                {name && (
                  <div>
                    <p className="text-sm font-mono text-mediumteal dark:text-sage mb-1">Name:</p>
                    <p className="font-mono font-medium text-deepteal dark:text-tcream">{name}</p>
                  </div>
                )}
                {description && (
                  <div>
                    <p className="text-sm font-mono text-mediumteal dark:text-sage mb-1">Description:</p>
                    <p className="text-mediumteal dark:text-mint leading-relaxed">{description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="flex items-center justify-between pt-6 border-t border-mint/20 dark:border-sage/20">
            <button
              type="submit"
              disabled={!user || isPending || !name.trim()}
              className={`px-8 py-3 rounded-xl font-mono font-medium transition-all duration-200 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                !user || isPending || !name.trim()
                  ? "opacity-60 bg-sage/50 text-tcream cursor-not-allowed" 
                  : "bg-gradient-to-r from-sage to-mint text-deepteal hover:from-mint hover:to-sage"
              }`}
              title={!user ? "Please login to create a community" : !name.trim() ? "Community name is required" : undefined}
            >
              {isPending && (
                <div className="w-5 h-5 border-2 border-deepteal/30 border-t-deepteal rounded-full animate-spin"></div>
              )}
              {isPending ? "Creating Community..." : "Create Community"}
              {!isPending && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>

            {!user && (
              <div className="flex items-center space-x-2 bg-mint/10 border border-mint/20 rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-mono text-mediumteal">Login required to create community</span>
              </div>
            )}
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-center gap-3 bg-sage/10 border border-sage/30 rounded-xl p-4 mt-4">
              <div className="w-6 h-6 bg-sage rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-tcream" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-mono font-medium text-deepteal dark:text-tcream">Community Created!</p>
                <p className="text-sm text-mediumteal dark:text-mint">Redirecting to communities page...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-4">
              <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              <p className="font-mono text-red-400">Failed to create community. Please try again.</p>
            </div>
          )}

          {/* Community Stats */}
          <div className="pt-6 border-t border-mint/10 dark:border-sage/10">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="w-8 h-8 bg-teal/10 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-xs font-mono text-mediumteal dark:text-sage">You'll be admin</p>
              </div>
              <div className="space-y-1">
                <div className="w-8 h-8 bg-sage/10 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-4 h-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-xs font-mono text-mediumteal dark:text-sage">Public by default</p>
              </div>
              <div className="space-y-1">
                <div className="w-8 h-8 bg-mint/10 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-4 h-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-xs font-mono text-mediumteal dark:text-sage">Instant activation</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};