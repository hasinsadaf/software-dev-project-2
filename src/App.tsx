import Dashboard from "./pages/Dashboard";
import { Route, Routes, useLocation } from "react-router";
import { Home } from "./pages/Home";
import { Navbar } from "./components/Navbar";
import { CreatePostPage } from "./pages/CreatePostPage";
import { PostPage } from "./pages/PostPage";
import { CreateCommunityPage } from "./pages/CreateCommunityPage";
import { CommunitiesPage } from "./pages/CommunitiesPage";
import { CommunityPage } from "./pages/CommunityPage";
import { ExplorePage } from "./pages/ExplorePage";
import { PostDetailsPage } from "./pages/PostDetailsPage";
import { Sidebar } from "./components/Sidebar";

function App() {
  const location = useLocation();
  const pathname = location.pathname;
  const showCommunityFab = pathname === "/communities" || /^\/community\/[^/]+$/.test(pathname);
  
  return (
    <div className="min-h-screen bg-tcream dark:bg-deepteal text-deepteal dark:text-tcream transition-all duration-500 pt-20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-mint/10 to-sage/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-teal/10 to-mediumteal/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-sage/5 via-mint/5 to-teal/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '60s' }}></div>
      </div>

      <Navbar />
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex gap-8">
          <Sidebar />
          <main className="flex-1 min-w-0 relative">
            {/* Main content backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-tcream/20 via-transparent to-mint/10 dark:from-deepteal/20 dark:via-transparent dark:to-sage/10 rounded-3xl backdrop-blur-sm pointer-events-none"></div>
            
            <div className="relative z-10">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreatePostPage />} />
                <Route path="/post/:id" element={<PostPage />} />
                {/* New redesigned Post Details Page (optional route) */}
                <Route path="/post-details/:id" element={<PostDetailsPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/community/create" element={<CreateCommunityPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route path="/community/:id" element={<CommunityPage />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Modern FABs with glassmorphism */}
        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-50">
          {/* New Post FAB */}
          <a
            href="/create"
            className="group relative overflow-hidden inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-teal/90 to-mediumteal/90 backdrop-blur-lg border border-teal/30 text-tcream shadow-2xl hover:shadow-teal/25 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            aria-label="Create post"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-mediumteal to-teal opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Tech indicators */}
            <div className="relative flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-tcream rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-tcream/70 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            
            <div className="relative flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
              <span className="hidden sm:inline font-mono font-medium">New Post</span>
            </div>

            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-tcream/20 to-transparent rounded-bl-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          </a>

          {/* Community FAB - only show when needed */}
          {showCommunityFab && (
            <a
              href="/community/create"
              className="group relative overflow-hidden inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-sage/90 to-mint/90 backdrop-blur-lg border border-sage/30 text-deepteal shadow-2xl hover:shadow-sage/25 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              aria-label="Create community"
              style={{ animationDelay: '0.1s' }}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-mint to-sage opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Tech indicators */}
              <div className="relative flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-deepteal rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-deepteal/70 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
              
              <div className="relative flex items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline font-mono font-medium">New Community</span>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-deepteal/20 to-transparent rounded-bl-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </a>
          )}

          {/* Subtle connection line between FABs */}
          {showCommunityFab && (
            <div className="absolute right-8 top-20 w-0.5 h-4 bg-gradient-to-b from-teal/30 to-sage/30 rounded-full"></div>
          )}
        </div>

        {/* Ambient glow effects for FABs */}
        <div className="fixed bottom-8 right-8 pointer-events-none z-40">
          <div className="w-20 h-20 bg-teal/20 rounded-full blur-xl animate-pulse"></div>
          {showCommunityFab && (
            <div className="w-16 h-16 bg-sage/20 rounded-full blur-xl animate-pulse mt-4" style={{ animationDelay: '1s' }}></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;