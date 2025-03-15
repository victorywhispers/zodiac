export const DATABASE_CONFIG = {
    WEAVIATE: {
        url: import.meta.env.VITE_WEAVIATE_URL,
        apiKey: import.meta.env.VITE_WEAVIATE_API_KEY
    },
    SUPABASE: {
        url: 'https://ybmwyhyylqhkfgtspllm.supabase.co',
        apiKey: import.meta.env.VITE_SUPABASE_API_KEY // Use environment variable instead of hardcoded key
    }
};
