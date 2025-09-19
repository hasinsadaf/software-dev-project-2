import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "../supabase-client";
import { Link } from "react-router";

export interface Community {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export const fetchCommunities = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Community[];
};

export const CommunityList = () => {
  const [sortBy, setSortBy] = useState<"alphabetical" | "newest" | "oldest">("alphabetical");
  const { data, error, isLoading } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: fetchCommunities,
  });

  const sorted = useMemo(() => {
    const list = [...(data || [])];
    if (sortBy === "alphabetical") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "newest") {
      return list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    // oldest
    return list.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [data, sortBy]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-mint/20 border-t-teal rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-sage/10 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-deep-teal dark:text-tcream font-mono text-sm">
          Loading communities<span className="animate-pulse">...</span>
        </span>
      </div>
    );

  if (error)
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Sort Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-1 bg-gradient-to-b from-deepteal to-sage rounded-full"></div>
          <h1 className="text-2xl font-bold font-mono text-deepteal dark:text-tcream">
            Communities
          </h1>
          <div className="px-3 py-1 bg-teal/10 border border-teal/20 rounded-full">
            <span className="text-teal text-sm font-mono">{sorted?.length || 0}</span>
          </div>
        </div>
        
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none bg-tcream/10 dark:bg-deepteal/30 backdrop-blur-md border border-mint/30 dark:border-sage/20 rounded-xl px-4 py-2 pr-10 text-deepteal dark:text-tcream text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <option value="alphabetical">A → Z</option>
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

      {/* Community Grid */}
      <div className="grid gap-4 md:gap-6">
        {sorted?.map((community, index) => (
          <div
            key={community.id}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 hover:border-mediumteal/40 dark:hover:border-mediumteal/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-mediumteal/20 to-transparent rounded-bl-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Content */}
            <div className="relative p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {/* Tech-style indicator */}
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-teal rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    
                    <Link
                      to={`/community/${community.id}`}
                      className="text-xl md:text-2xl font-bold font-mono text-deepteal dark:text-tcream hover:text-mediumteal dark:hover:text-sage transition-colors duration-200 group-hover:underline decoration-2 underline-offset-4"
                    >
                      {community.name}
                    </Link>
                  </div>
                  
                  <p className="text-mediumteal dark:text-mint text-sm md:text-base leading-relaxed font-light">
                    {community.description}
                  </p>
                </div>

                {/* Arrow icon */}
                <div className="ml-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>

              {/* Footer with metadata */}
              <div className="flex items-center justify-between pt-4 border-t border-mint/10 dark:border-sage/10">
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-mono text-sage dark:text-mint bg-sage/10 dark:bg-mint/10 px-2 py-1 rounded-md">
                    ID: {community.id.toString().padStart(4, '0')}
                  </span>
                  
                  <span className="text-xs font-mono text-mediumteal dark:text-sage">
                    {new Date(community.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-mediumteal/20 rounded-2xl transition-all duration-300 pointer-events-none"></div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {sorted?.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-mint/20 to-sage/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-mono text-deepteal dark:text-tcream mb-2">
            No Communities Found
          </h3>
          <p className="text-sage dark:text-mint text-sm">
            Be the first to create a community and start connecting!
          </p>
        </div>
      )}
    </div>
  );
};