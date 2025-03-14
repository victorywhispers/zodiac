export const DATABASE_CONFIG = {
    WEAVIATE: {
        url: import.meta.env.VITE_WEAVIATE_URL,
        apiKey: import.meta.env.VITE_WEAVIATE_API_KEY
    },
    SUPABASE: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        apiKey: import.meta.env.VITE_SUPABASE_API_KEY || ''
    }
};