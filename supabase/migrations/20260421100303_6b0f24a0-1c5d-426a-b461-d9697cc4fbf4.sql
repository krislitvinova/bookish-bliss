-- Status enum
create type public.book_status as enum ('reading', 'finished', 'to-read');

-- Books table
create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text not null default '',
  status public.book_status not null default 'to-read',
  rating int not null default 0,
  notes text not null default '',
  finished_at timestamptz,
  current_page int,
  total_pages int,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_user_id_created_at_idx on public.books (user_id, created_at desc);

alter table public.books enable row level security;

create policy "Users can view their own books"
  on public.books for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on public.books for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on public.books for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own books"
  on public.books for delete
  to authenticated
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_set_updated_at
before update on public.books
for each row execute function public.set_updated_at();