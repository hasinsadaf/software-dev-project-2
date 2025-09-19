import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase-client";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signInWithGitHub, signOut, user } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<
    Array<{ id: number; type: "post" | "community"; label: string }>
  >([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close search on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Auto-focus input when opening search
  useEffect(() => {
    if (containerRef.current && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showResults]);

  // Escape key closes search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowResults(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Search logic
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    const handle = setTimeout(async () => {
      try {
        const searchTerm = `%${query.trim()}%`;

        const [postRes, commRes] = await Promise.all([
          supabase.from("posts").select("id, title").ilike("title", searchTerm).limit(5),
          supabase.from("communities").select("id, name").ilike("name", searchTerm).limit(5),
        ]);

        if (postRes.error || commRes.error) {
          throw new Error(postRes.error?.message || commRes.error?.message || "Search failed");
        }

        const mapped = [
          ...(postRes.data || []).map((p: any) => ({
            id: p.id,
            type: "post" as const,
            label: p.title,
          })),
          ...(commRes.data || []).map((c: any) => ({
            id: c.id,
            type: "community" as const,
            label: c.name,
          })),
        ];

        setResults(mapped);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  const handleSelect = (item: { id: number; type: "post" | "community" }) => {
    setShowResults(false);
    setQuery("");
    setMenuOpen(false);
    if (item.type === "post") navigate(`/post/${item.id}`);
    else navigate(`/community/${item.id}`);
  };

  const displayName = user?.user_metadata?.user_name || user?.email?.split("@")[0] || "User";

  return (
    <nav className="fixed top-0 w-full z-50 bg-deepteal/25 dark:bg-deepteal/35 backdrop-blur-2xl 
                    border-b border-mint/20 shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          
          {/* Logo with enhanced styling */}
          <Link
            to="/"
            className="group flex items-center space-x-2 font-mono text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide"
          >
            <div className="relative">
              <span className="text-tcream group-hover:text-mint transition-all duration-300 drop-shadow-lg">
                Comm
              </span>
              <span className="text-mint group-hover:text-tcream transition-all duration-300 drop-shadow-lg">
                unity
              </span>
              <div className="absolute -bottom-1 left-0 h-0.5 w-0 bg-mint group-hover:w-full transition-all duration-300"></div>
            </div>
          </Link>

          {/* Desktop Search with modern styling */}
          <div className="hidden lg:flex items-center flex-1 justify-center max-w-2xl mx-8">
            <div className="relative w-full group" ref={containerRef}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-sage group-focus-within:text-mint transition-colors duration-200" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setShowResults(true)}
                placeholder="Search posts and communities..."
                className="w-full font-mono bg-deepteal/30 backdrop-blur-xl border border-mint/20 
                          rounded-2xl pl-12 pr-6 py-3.5 text-sm text-tcream placeholder-sage/70 
                          focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint/40
                          shadow-lg hover:shadow-xl hover:bg-deepteal/40 transition-all duration-300
                          group-focus-within:scale-[1.02] transform"
              />
              
              {query && (
                <button
                  onClick={() => {setQuery(""); setShowResults(false);}}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-sage hover:text-tcream transition-colors duration-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Enhanced Search Results */}
              {showResults && (
                <div className="absolute mt-3 w-full bg-deepteal/85 backdrop-blur-2xl border border-mint/20 
                               rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                  {isSearching && (
                    <div className="px-6 py-4 flex items-center space-x-3 text-mint">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-mint border-t-transparent"></div>
                      <span className="text-sm font-medium">Searching...</span>
                    </div>
                  )}
                  
                  {!isSearching && results.length === 0 && (
                    <div className="px-6 py-4 text-sage text-sm flex items-center space-x-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.94-6.071 2.071" />
                      </svg>
                      <span>No results found</span>
                    </div>
                  )}
                  
                  {!isSearching && results.length > 0 && (
                    <div className="max-h-80 overflow-auto">
                      {results.map((r, index) => (
                        <div
                          key={`${r.type}-${r.id}`}
                          className="group px-6 py-3.5 hover:bg-mint/10 cursor-pointer transition-all duration-200
                                   border-b border-mint/10 last:border-b-0 flex items-center justify-between"
                          onClick={() => handleSelect(r)}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              r.type === 'post' ? 'bg-mint' : 'bg-teal'
                            } group-hover:scale-110 transition-transform duration-200`}></div>
                            <span className="truncate text-tcream group-hover:text-mint transition-colors duration-200 font-medium">
                              {r.label}
                            </span>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                            r.type === 'post' 
                              ? 'bg-mint/20 text-mint' 
                              : 'bg-teal/20 text-teal'
                          }`}>
                            {r.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Auth with modern buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-deepteal/30 backdrop-blur-lg border border-mint/20">
                  {user.user_metadata?.avatar_url && (
                    <div className="relative">
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-mint/40"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-mint rounded-full border-2 border-deepteal"></div>
                    </div>
                  )}
                  <span className="text-tcream font-mono text-sm font-medium truncate max-w-32">
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="relative px-5 py-2.5 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 
                           text-white font-mono font-medium rounded-xl transition-all duration-300 
                           shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm
                           before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r 
                           before:from-red-400/20 before:to-red-500/20 before:opacity-0 
                           hover:before:opacity-100 before:transition-opacity before:duration-300"
                >
                  <span className="relative">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGitHub}
                className="relative px-6 py-3 bg-gradient-to-r from-mint/80 via-teal/80 to-mint/90 
                         hover:from-mint hover:via-teal hover:to-mint text-deepteal font-mono font-semibold 
                         rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 
                         active:scale-95 backdrop-blur-sm group
                         before:absolute before:inset-0 before:rounded-xl before:bg-white/10 before:opacity-0 
                         hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <span className="relative flex items-center gap-2">
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" 
                       fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Sign in with GitHub
                </span>
              </button>
            )}
          </div>

          {/* Modern Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative p-3 text-tcream rounded-xl bg-deepteal/30 backdrop-blur-lg border border-mint/20 
                       hover:bg-mint/20 hover:border-mint/40 transition-all duration-300 hover:scale-105 active:scale-95 group"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-5 relative">
                <span className={`absolute left-0 top-0 w-5 h-0.5 bg-current transition-all duration-300 
                  ${menuOpen ? 'rotate-45 top-2' : 'top-0'}`}></span>
                <span className={`absolute left-0 top-2 w-5 h-0.5 bg-current transition-all duration-300 
                  ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`absolute left-0 bottom-0 w-5 h-0.5 bg-current transition-all duration-300 
                  ${menuOpen ? '-rotate-45 bottom-2' : 'bottom-0'}`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-deepteal/90 backdrop-blur-2xl border-t border-mint/20 shadow-2xl
                       animate-in slide-in-from-top-2 duration-300">
          <div className="px-4 py-6 space-y-6">
            
            {/* Mobile Search */}
            <div className="relative" ref={containerRef}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setShowResults(true)}
                placeholder="Search..."
                className="w-full font-mono bg-deepteal/40 backdrop-blur-xl border border-mint/30 
                          rounded-2xl pl-12 pr-6 py-4 text-tcream placeholder-sage/70 
                          focus:outline-none focus:ring-2 focus:ring-mint/60 focus:border-mint/50
                          shadow-lg transition-all duration-300"
              />

              {showResults && (
                <div className="absolute mt-3 w-full bg-deepteal/90 backdrop-blur-2xl border border-mint/30 
                               rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {isSearching && (
                    <div className="px-4 py-3 flex items-center space-x-3 text-mint">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-mint border-t-transparent"></div>
                      <span className="text-sm">Searching...</span>
                    </div>
                  )}
                  
                  {!isSearching && results.length === 0 && (
                    <div className="px-4 py-3 text-sage text-sm">No results found</div>
                  )}
                  
                  {!isSearching && results.length > 0 && (
                    <div className="max-h-64 overflow-auto">
                      {results.map((r) => (
                        <div
                          key={`${r.type}-${r.id}`}
                          className="px-4 py-3 hover:bg-mint/10 cursor-pointer transition-colors duration-200 
                                   border-b border-mint/10 last:border-b-0 flex items-center justify-between"
                          onClick={() => handleSelect(r)}
                        >
                          <span className="truncate text-tcream mr-3 font-medium">{r.label}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            r.type === 'post' ? 'bg-mint/20 text-mint' : 'bg-teal/20 text-teal'
                          }`}>
                            {r.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Auth */}
            <div className="space-y-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-3 p-4 bg-deepteal/40 backdrop-blur-lg 
                                rounded-2xl border border-mint/20">
                    {user.user_metadata?.avatar_url && (
                      <div className="relative">
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-mint/40"
                        />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-mint rounded-full border-2 border-deepteal"></div>
                      </div>
                    )}
                    <span className="text-tcream font-mono font-medium">{displayName}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-500/90 to-red-600/90 
                             hover:from-red-600 hover:to-red-700 text-white font-mono font-medium 
                             rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl 
                             hover:scale-[1.02] active:scale-95"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={signInWithGitHub}
                  className="w-full px-6 py-4 bg-gradient-to-r from-mint/80 via-teal/80 to-mint/90 
                           hover:from-mint hover:via-teal hover:to-mint text-deepteal font-mono font-semibold 
                           rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl 
                           hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Sign in with GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};