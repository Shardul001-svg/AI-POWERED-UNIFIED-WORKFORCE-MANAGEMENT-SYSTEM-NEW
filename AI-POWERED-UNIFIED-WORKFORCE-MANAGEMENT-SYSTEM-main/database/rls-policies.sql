BEGIN;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
CREATE POLICY "profiles_select_self"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
);

DROP POLICY IF EXISTS "employees_select_admin_hr_or_self" ON public.employees;
CREATE POLICY "employees_select_admin_hr_or_self"
ON public.employees
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'HR')
  OR profile_id = auth.uid()
);

DROP POLICY IF EXISTS "employees_insert_admin_hr" ON public.employees;
CREATE POLICY "employees_insert_admin_hr"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
);

DROP POLICY IF EXISTS "employees_update_admin_hr_or_self" ON public.employees;
CREATE POLICY "employees_update_admin_hr_or_self"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR profile_id = auth.uid()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR profile_id = auth.uid()
);

DROP POLICY IF EXISTS "employees_delete_admin" ON public.employees;
CREATE POLICY "employees_delete_admin"
ON public.employees
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
);

DROP POLICY IF EXISTS "candidates_select_admin_hr_or_self" ON public.candidates;
CREATE POLICY "candidates_select_admin_hr_or_self"
ON public.candidates
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'HR')
  OR lower(email) = lower(auth.email())
);

DROP POLICY IF EXISTS "candidates_insert_admin_hr" ON public.candidates;
CREATE POLICY "candidates_insert_admin_hr"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
);

DROP POLICY IF EXISTS "candidates_update_admin_hr_or_self" ON public.candidates;
CREATE POLICY "candidates_update_admin_hr_or_self"
ON public.candidates
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR lower(email) = lower(auth.email())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR lower(email) = lower(auth.email())
);

DROP POLICY IF EXISTS "candidates_delete_admin_hr" ON public.candidates;
CREATE POLICY "candidates_delete_admin_hr"
ON public.candidates
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
);

DROP POLICY IF EXISTS "interviews_select_admin_hr_or_related" ON public.interviews;
CREATE POLICY "interviews_select_admin_hr_or_related"
ON public.interviews
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'HR')
  OR interviewer = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.candidates c
    WHERE c.id = candidate_id AND lower(c.email) = lower(auth.email())
  )
);

DROP POLICY IF EXISTS "interviews_insert_admin_hr" ON public.interviews;
CREATE POLICY "interviews_insert_admin_hr"
ON public.interviews
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
);

DROP POLICY IF EXISTS "interviews_update_admin_hr" ON public.interviews;
CREATE POLICY "interviews_update_admin_hr"
ON public.interviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
);

DROP POLICY IF EXISTS "interviews_delete_admin_hr" ON public.interviews;
CREATE POLICY "interviews_delete_admin_hr"
ON public.interviews
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
);

DROP POLICY IF EXISTS "requests_select_admin_hr_or_self" ON public.requests;
CREATE POLICY "requests_select_admin_hr_or_self"
ON public.requests
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'HR')
  OR employee_id IN (
    SELECT e.id
    FROM public.employees e
    WHERE e.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "requests_insert_admin_hr_or_self" ON public.requests;
CREATE POLICY "requests_insert_admin_hr_or_self"
ON public.requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR employee_id IN (
    SELECT e.id
    FROM public.employees e
    WHERE e.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "requests_update_admin_hr_or_self" ON public.requests;
CREATE POLICY "requests_update_admin_hr_or_self"
ON public.requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR employee_id IN (
    SELECT e.id
    FROM public.employees e
    WHERE e.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR employee_id IN (
    SELECT e.id
    FROM public.employees e
    WHERE e.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tasks_select_admin_hr_or_self" ON public.tasks;
CREATE POLICY "tasks_select_admin_hr_or_self"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'HR')
  OR assigned_to = auth.uid()
);

DROP POLICY IF EXISTS "tasks_insert_admin_hr_or_self" ON public.tasks;
CREATE POLICY "tasks_insert_admin_hr_or_self"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR assigned_to = auth.uid()
);

DROP POLICY IF EXISTS "tasks_update_admin_hr_or_self" ON public.tasks;
CREATE POLICY "tasks_update_admin_hr_or_self"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR assigned_to = auth.uid()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
  OR assigned_to = auth.uid()
);

DROP POLICY IF EXISTS "notifications_select_self" ON public.notifications;
CREATE POLICY "notifications_select_self"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid()
);

DROP POLICY IF EXISTS "notifications_update_self" ON public.notifications;
CREATE POLICY "notifications_update_self"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  profile_id = auth.uid()
)
WITH CHECK (
  profile_id = auth.uid()
);

DROP POLICY IF EXISTS "activities_select_admin_hr_or_self" ON public.activities;
CREATE POLICY "activities_select_admin_hr_or_self"
ON public.activities
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'HR')
  OR profile_id = auth.uid()
);

DROP POLICY IF EXISTS "activities_insert_self_or_admin_hr" ON public.activities;
CREATE POLICY "activities_insert_self_or_admin_hr"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'HR'))
);

COMMIT;
