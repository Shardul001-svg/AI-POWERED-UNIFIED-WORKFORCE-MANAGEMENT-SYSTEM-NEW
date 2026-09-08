insert into public.profiles (id, full_name, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'Taylor Smith', 'taylor.smith@example.com', 'ADMIN'),
  ('00000000-0000-0000-0000-000000000002', 'Morgan Lee', 'morgan.lee@example.com', 'HR'),
  ('00000000-0000-0000-0000-000000000003', 'Alex Morgan', 'alex.morgan@example.com', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000004', 'Jordan Chen', 'jordan.chen@example.com', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000005', 'Sam Rivera', 'sam.rivera@example.com', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000006', 'Priya Shah', 'priya.shah@example.com', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000007', 'Owen Brooks', 'owen.brooks@example.com', 'EMPLOYEE')
on conflict (id) do nothing;

insert into public.employees (id, profile_id, employee_code, phone, department, position, joining_date, status) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'EMP-001', '+1 555-0101', 'Customer Success', 'Customer Success Manager', '2023-03-14', 'ACTIVE'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'EMP-002', '+1 555-0102', 'Operations', 'Operations Lead', '2022-08-22', 'ACTIVE'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'EMP-003', '+1 555-0103', 'Field Services', 'Field Technician', '2024-01-08', 'ACTIVE'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 'EMP-004', '+1 555-0104', 'People Operations', 'People Partner', '2021-11-01', 'ACTIVE'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000007', 'EMP-005', '+1 555-0105', 'Finance', 'Payroll Specialist', '2024-06-17', 'ACTIVE')
on conflict (id) do nothing;

insert into public.candidates (id, full_name, email, phone, position_applied, experience, status) values
  ('20000000-0000-0000-0000-000000000001', 'Nora Patel', 'nora.patel@example.com', '+1 555-0201', 'Product Designer', 4, 'SCREENING'),
  ('20000000-0000-0000-0000-000000000002', 'Ethan Wilson', 'ethan.wilson@example.com', '+1 555-0202', 'Frontend Engineer', 3, 'INTERVIEW'),
  ('20000000-0000-0000-0000-000000000003', 'Maya Thompson', 'maya.thompson@example.com', '+1 555-0203', 'HR Coordinator', 2, 'SELECTED'),
  ('20000000-0000-0000-0000-000000000004', 'Liam Garcia', 'liam.garcia@example.com', '+1 555-0204', 'Field Technician', 5, 'APPLIED'),
  ('20000000-0000-0000-0000-000000000005', 'Sofia Kim', 'sofia.kim@example.com', '+1 555-0205', 'Operations Analyst', 2, 'REJECTED'),
  ('20000000-0000-0000-0000-000000000006', 'Noah Williams', 'noah.williams@example.com', '+1 555-0206', 'Customer Success Manager', 6, 'SCREENING')
on conflict (id) do nothing;

insert into public.interviews (id, candidate_id, interviewer, interview_date, interview_time, status, notes) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '2026-09-09', '10:00', 'SCHEDULED', 'Technical interview and portfolio review.'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '2026-09-05', '14:00', 'COMPLETED', 'Strong communication and people operations experience.'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-09-11', '11:30', 'SCHEDULED', 'Review design exercise and product thinking.'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '2026-09-02', '09:30', 'CANCELLED', 'Candidate withdrew before the interview.')
on conflict (id) do nothing;

insert into public.requests (id, employee_id, type, title, description, status) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'LEAVE', 'Annual leave request', 'Requesting three days off for a family event.', 'PENDING'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'DOCUMENT', 'Employment verification letter', 'Please provide a signed employment verification letter.', 'APPROVED'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'HR_QUERY', 'Benefits enrollment question', 'Asking about the next benefits enrollment window.', 'COMPLETED'),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'OTHER', 'Desk equipment request', 'Requesting an ergonomic keyboard for the home office.', 'PENDING'),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'LEAVE', 'Personal day', 'Requesting one personal day later this month.', 'REJECTED')
on conflict (id) do nothing;

insert into public.tasks (id, title, description, assigned_to, related_type, related_id, status, due_date) values
  ('50000000-0000-0000-0000-000000000001', 'Review candidate portfolio', 'Complete the first-pass review for the product designer role.', '00000000-0000-0000-0000-000000000002', 'candidate', '20000000-0000-0000-0000-000000000001', 'IN_PROGRESS', '2026-09-09'),
  ('50000000-0000-0000-0000-000000000002', 'Approve September leave calendar', 'Check coverage and confirm pending leave requests.', '00000000-0000-0000-0000-000000000001', 'request', '40000000-0000-0000-0000-000000000001', 'TODO', '2026-09-10'),
  ('50000000-0000-0000-0000-000000000003', 'Prepare onboarding checklist', 'Finalize access and welcome materials for the new hire.', '00000000-0000-0000-0000-000000000006', null, null, 'COMPLETED', '2026-09-08'),
  ('50000000-0000-0000-0000-000000000004', 'Schedule field coverage', 'Assign a technician to the Friday service route.', '00000000-0000-0000-0000-000000000004', null, null, 'IN_PROGRESS', '2026-09-12'),
  ('50000000-0000-0000-0000-000000000005', 'Send interview follow-up', 'Send the next-step email to the selected candidate.', '00000000-0000-0000-0000-000000000002', 'candidate', '20000000-0000-0000-0000-000000000003', 'TODO', '2026-09-09')
on conflict (id) do nothing;

insert into public.notifications (id, profile_id, title, message, type, is_read) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Leave request needs review', 'Alex Morgan submitted a new leave request.', 'REQUEST', false),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Interview tomorrow', 'Ethan Wilson is scheduled for 10:00 tomorrow.', 'INTERVIEW', false),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Request approved', 'Your employment verification request was approved.', 'REQUEST', true),
  ('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Coverage update', 'The Friday field service route needs coverage.', 'SCHEDULE', false),
  ('60000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Welcome checklist ready', 'Your onboarding checklist is ready for review.', 'TASK', true),
  ('60000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', 'Payroll reminder', 'Please verify your bank details before Friday.', 'REMINDER', false)
on conflict (id) do nothing;

insert into public.activities (id, profile_id, action, description) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'REQUEST_REVIEWED', 'Reviewed the September leave calendar.'),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'CANDIDATE_UPDATED', 'Moved Ethan Wilson to interview stage.'),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'PROFILE_UPDATED', 'Updated phone number and contact details.'),
  ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'SHIFT_ASSIGNED', 'Accepted the Friday service route.'),
  ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'TASK_COMPLETED', 'Completed the field equipment inspection.'),
  ('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'REQUEST_CREATED', 'Submitted an equipment request.'),
  ('70000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 'DOCUMENT_VIEWED', 'Viewed the latest payroll document.'),
  ('70000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'INTERVIEW_SCHEDULED', 'Scheduled an interview with Nora Patel.'),
  ('70000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', 'CANDIDATE_SELECTED', 'Marked Maya Thompson as selected.'),
  ('70000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'REQUEST_APPROVED', 'Approved the employment verification request.')
on conflict (id) do nothing;