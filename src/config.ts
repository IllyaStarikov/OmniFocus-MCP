export const config = {
  /** Timeout for osascript execution in milliseconds */
  executorTimeout: 30_000,

  /** Maximum buffer size for osascript stdout/stderr */
  maxBuffer: 10 * 1024 * 1024, // 10 MB

  /** Cache TTLs in milliseconds by domain */
  cacheTTL: {
    tasks: 10_000,
    projects: 30_000,
    folders: 60_000,
    tags: 60_000,
    database: 60_000,
    perspectives: 60_000,
  },

  /** Default pagination limit */
  defaultLimit: 100,

  /** Maximum pagination limit */
  maxLimit: 1000,
} as const;
