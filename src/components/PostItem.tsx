import { Link } from "react-router";
import type { Post } from "./PostList";

interface Props {
  post: Post;
}

export const PostItem = ({ post }: Props) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-tcream/5 via-mint/10 to-sage/5 dark:from-deepteal/20 dark:via-mediumteal/10 dark:to-sage/5 backdrop-blur-lg border border-mint/20 dark:border-sage/10 hover:border-mediumteal/40 dark:hover:border-mint/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-mediumteal/0 via-sage/5 to-mint/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-mediumteal/20 to-transparent rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>

      <Link to={`/post/${post.id}`} className="block relative">
        <article className="relative flex flex-col h-80 overflow-hidden">
          
          {/* Header */}
          <header className="p-4 flex items-center gap-3 relative z-10">
            {/* Tech-style indicator */}
            <div className="flex items-center space-x-1 mr-2">
              <div className="w-1.5 h-1.5 bg-mediumteal rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-sage rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            
            {post.avatar_url ? (
              <img 
                src={post.avatar_url} 
                alt="User Avatar" 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-mint/30 dark:ring-sage/20" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mediumteal to-sage shadow-lg" />
            )}
            
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold font-mono text-deepteal dark:text-tcream truncate group-hover:text-mediumteal dark:group-hover:text-sage transition-colors duration-200">
                {post.title}
              </h3>
              <div className="text-xs font-mono text-sage dark:text-mint">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: '2-digit'
                })}
              </div>
            </div>
            
            {/* Type badge */}
            <div className="flex gap-1">
              {post.is_announcement ? (
                <div className="flex items-center space-x-1 px-2 py-1 text-xs rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                  <span>PIN</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 px-2 py-1 text-xs rounded-full bg-mediumteal/10 text-mediumteal border border-mediumteal/20 font-mono">
                  <span className="w-1.5 h-1.5 bg-teal rounded-full"></span>
                  <span>POST</span>
                </div>
              )}
            </div>
          </header>

          {/* Image section with tech overlay */}
          <div className="relative w-full h-40 md:h-44 bg-gradient-to-br from-mint/10 to-sage/10 dark:from-deepteal/20 dark:to-mediumteal/10 overflow-hidden">
            {post.image_url ? (
              <>
                <img 
                  src={post.image_url} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                {/* Image overlay with scan line effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mediumteal/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mint/20 to-sage/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-mediumteal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Post ID badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md">
              <span className="text-xs font-mono text-white/80">#{post.id.toString().padStart(4, '0')}</span>
            </div>
          </div>

          {/* Content preview */}
          <div className="px-4 py-2 flex-1 min-h-0">
            <p className="text-xs text-mediumteal dark:text-mint leading-relaxed line-clamp-1 font-light">
              {post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : 'No content preview available'}
            </p>
          </div>

          {/* Footer actions */}
          <footer className="p-4 pt-2 border-t border-mint/10 dark:border-sage/10 bg-gradient-to-r from-transparent via-white/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="group/btn inline-flex items-center gap-2 text-sage dark:text-mint hover:text-deepteal dark:hover:text-sage transition-all duration-200 text-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center group-hover/btn:from-red-500/40 group-hover/btn:to-pink-500/40 transition-all duration-200">
                    <span className="text-xs">❤️</span>
                  </div>
                  <span className="font-mono text-xs">{post.like_count ?? 0}</span>
                </button>
                
                <button className="group/btn inline-flex items-center gap-2 text-sage dark:text-mint hover:text-teal dark:hover:text-sage transition-all duration-200 text-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover/btn:from-blue-500/40 group-hover/btn:to-cyan-500/40 transition-all duration-200">
                    <span className="text-xs">💬</span>
                  </div>
                  <span className="font-mono text-xs">{post.comment_count ?? 0}</span>
                </button>
              </div>
              
              {/* Read more with arrow */}
              <div className="flex items-center space-x-2 text-xs font-mono text-sage dark:text-mint group-hover:text-teal dark:group-hover:text-sage transition-colors duration-200">
                <span>READ</span>
                <div className="flex items-center space-x-px opacity-70 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200">
                  <div className="w-1 h-px bg-current"></div>
                  <div className="w-1 h-px bg-current"></div>
                  <div className="w-1 h-px bg-current"></div>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-mint/5 dark:border-sage/5">
              <div className="flex items-center space-x-2">
                {post.author && (
                  <span className="text-xs font-mono text-sage/60 dark:text-mint/60">
                    by {post.author}
                  </span>
                )}
              </div>
            </div>
          </footer>
        </article>
      </Link>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-teal/20 rounded-2xl transition-all duration-300 pointer-events-none"></div>
    </div>
  );
};