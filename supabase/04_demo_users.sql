-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 04: Demo user roles
--
-- FIRST create these 3 users in the Supabase Dashboard:
--   Authentication → Users → "Add user" → Create new user
--   (tick "Auto Confirm User" so no email confirmation is needed)
--
--   1) admin@bazzaal.demo    password: bazzaal2026
--   2) creator@bazzaal.demo  password: bazzaal2026
--   3) brand@mixsoon.demo    password: bazzaal2026
--
-- THEN run this file. It assigns the roles to those accounts.
-- ════════════════════════════════════════════════════════════

insert into profiles (id, email, full_name, role, brand_name)
select u.id,
       u.email,
       case u.email
         when 'admin@bazzaal.demo'   then 'BAZZAAL Admin'
         when 'creator@bazzaal.demo' then 'Ashley Carter'
         when 'brand@mixsoon.demo'   then 'Mixsoon Brand Team'
       end,
       case u.email
         when 'admin@bazzaal.demo'   then 'bazzaal'
         when 'creator@bazzaal.demo' then 'creator'
         when 'brand@mixsoon.demo'   then 'brand'
       end,
       case u.email
         when 'brand@mixsoon.demo'   then 'Mixsoon'
         else null
       end
from auth.users u
where u.email in ('admin@bazzaal.demo', 'creator@bazzaal.demo', 'brand@mixsoon.demo')
on conflict (id) do update
  set email      = excluded.email,
      full_name  = excluded.full_name,
      role       = excluded.role,
      brand_name = excluded.brand_name;

-- Verify
select email, full_name, role, brand_name from profiles order by role;
