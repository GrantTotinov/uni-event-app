// Cache configuration for React Query
export const CACHE_KEYS = {
  // Comments
  COMMENTS: 'comments',
  COMMENT_LIKES: 'commentLikes',
  COMMENT_LIKES_USER: 'user',
  COMMENT_LIKES_COUNTS: 'counts',

  // Posts
  POSTS: 'posts',
  POST_LIKES: 'postLikes',

  // Users
  USERS: 'users',
  USER: 'user',
} as const

export const CACHE_TIMES = {
  // Comments cache for 5 minutes, search results for 30 seconds
  COMMENTS: 5 * 60 * 1000,
  COMMENTS_SEARCH: 30 * 1000,

  // Comment likes cache for 5 minutes, counts for 2 minutes
  COMMENT_LIKES: 5 * 60 * 1000,
  COMMENT_LIKE_COUNTS: 2 * 60 * 1000,

  // Posts cache for 2 minutes
  POSTS: 2 * 60 * 1000,
  POSTS_SEARCH: 30 * 1000,

  // User data cache for 10 minutes
  USER_DATA: 10 * 60 * 1000,
} as const

export const GC_TIMES = {
  // Garbage collection times (how long to keep unused data)
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 10 * 60 * 1000, // 10 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
} as const
