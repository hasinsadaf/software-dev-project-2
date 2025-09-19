import { Link, useLocation } from "react-router-dom";

const NavItem = ({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
        isActive
          ? "bg-gradient-to-r from-teal/20 via-sage/15 to-mint/20 border border-mediumteal/30 shadow-lg shadow-mediumteal/10"
          : "bg-tcream/5 dark:bg-deep-teal/10 border border-mint/10 dark:border-sage/10 hover:bg-gradient-to-r hover:from-mint/10 hover:via-sage/10 hover:to-teal/10 hover:border-teal/20 hover:shadow-md"
      }`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal/0 via-sage/5 to-mint/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Active indicator line */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal to-sage rounded-r-full"></div>
      )}
      
      {/* Content */}
      <div className="relative flex items-center gap-4 px-4 py-3">
        {/* Tech indicator dots */}
        <div className="flex flex-col items-center space-y-1">
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
            isActive 
              ? "bg-mediumteal animate-pulse shadow-sm shadow-mediumteal/50" 
              : "bg-sage/50 group-hover:bg-mediumteal group-hover:animate-pulse"
          }`}></div>
          <div className={`w-1 h-1 rounded-full transition-all duration-200 ${
            isActive 
              ? "bg-sage animate-pulse" 
              : "bg-mint/30 group-hover:bg-sage"
          }`} style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* Icon container */}
        <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-teal/20 text-deepteal dark:text-tcream shadow-inner"
            : "bg-mint/10 dark:bg-sage/10 text-sage dark:text-mint group-hover:bg-mediumteal/15 group-hover:text-mediumteal"
        }`}>
          <span className="w-5 h-5 inline-block relative z-10">{icon}</span>
          {/* Icon glow effect */}
          <div className={`absolute inset-0 rounded-lg transition-all duration-200 ${
            isActive ? "bg-mediumteal/10 blur-sm" : "group-hover:bg-mediumteal/5 group-hover:blur-sm"
          }`}></div>
        </div>
        
        {/* Label */}
        <div className="flex-1 min-w-0">
          <span className={`font-mono text-sm font-medium transition-all duration-200 ${
            isActive
              ? "text-deepteal dark:text-tcream"
              : "text-sage dark:text-mint group-hover:text-mediumteal dark:group-hover:text-sage"
          }`}>
            {label}
          </span>
          
          {/* Status indicator for active */}
          {isActive && (
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono text-green-400">ACTIVE</span>
            </div>
          )}
        </div>
        
        {/* Arrow indicator */}
        <div className={`transform transition-all duration-200 ${
          isActive 
            ? "translate-x-0 opacity-100" 
            : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
        }`}>
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 border border-transparent group-hover:border-mediumteal/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
    </Link>
  );
};

export const Sidebar = () => {
  return (
    <aside className="hidden md:block w-72 flex-shrink-0 relative">
      {/* Glassmorphism background */}
      <div className="sticky top-20 h-[calc(100vh-5rem)]">
        {/* Sidebar container with glass effect */}
        <div className="h-full bg-gradient-to-b from-tcream/10 via-mint/5 to-sage/10 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border-r border-mint/20 dark:border-sage/10 shadow-xl">
          
          {/* Header section */}
          <div className="p-6 border-b border-mint/10 dark:border-sage/10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-1 bg-gradient-to-r from-mediumteal to-sage rounded-full"></div>
              <h2 className="text-lg font-bold font-mono text-deepteal dark:text-tcream">
                Navigation
              </h2>
            </div>
          </div>
          
          {/* Navigation items */}
          <div className="p-4 space-y-3">
            <NavItem
              to="/"
              label="Home"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10.5l9-7 9 7V20a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3H10v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-9.5z" />
                </svg>
              }
            />
            
            <NavItem
              to="/explore"
              label="Explore"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-6.219-8.56" />
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              }
            />
            
            <NavItem
              to="/communities"
              label="Communities"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" strokeWidth="2" />
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
                </svg>
              }
            />
            
            <NavItem
              to="/dashboard"
              label="Dashboard"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <rect x="3" y="3" width="7" height="7" strokeWidth="2" rx="1" />
                  <rect x="14" y="3" width="7" height="7" strokeWidth="2" rx="1" />
                  <rect x="14" y="14" width="7" height="7" strokeWidth="2" rx="1" />
                  <rect x="3" y="14" width="7" height="7" strokeWidth="2" rx="1" />
                </svg>
              }
            />
          </div>
          
          
          
          {/* Footer section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-mint/10 dark:border-sage/10 bg-gradient-to-t from-tcream/20 to-transparent dark:from-deepteal/30 dark:to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-mediumteal to-sage flex items-center justify-center">
                  <span className="text-xs font-bold text-white">CT</span>
                </div>
                <div>
                  <div className="text-xs font-mono text-deep-teal dark:text-tcream">Community</div>
                  <div className="text-xs text-sage dark:text-mint">v2.1.0</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gradient-to-r from-teal to-sage rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-mediumteal">Collaborate</span>
              </div>
            </div>
          </div>
          
          {/* Scan line effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/60 to-transparent animate-pulse"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;