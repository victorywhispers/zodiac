create table if not exists chats (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    message text not null,
    timestamp bigint not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create index for faster user_id lookups
create index if not exists chats_user_id_idx on chats(user_id);