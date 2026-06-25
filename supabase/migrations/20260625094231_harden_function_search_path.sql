-- Security hardening: pin the trigger function's search_path (advisor 0011,
-- function_search_path_mutable). Prevents search_path injection.
alter function public.set_updated_at() set search_path = '';
