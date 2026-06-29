-- Security advisor (0028/0029): these are TRIGGER functions (fired by the trigger
-- mechanism, which ignores EXECUTE grants) but were inadvertently callable as RPCs by
-- anon/authenticated via /rest/v1/rpc/*. Revoke so they can't be invoked from the API.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.notify_new_message() from anon, authenticated, public;
revoke execute on function public.enforce_comment_rate_limit() from anon, authenticated, public;

-- NOTE (accepted, not changed): the security linter also flags the public storage buckets
-- `avatars` and `book-boxes` as "allows listing". Dropping their SELECT policy DID stop
-- listing but also broke image display on this setup (objects are served through the
-- SELECT policy, not the public CDN path), so the read policies are kept. The residual
-- exposure (an enumerator can learn which user-ids have an avatar) is low-sensitivity.
-- The remaining `authenticated_security_definer_function_executable` warnings are all
-- intentional RPCs, each scoped internally by auth.uid() / is_circle_member().
