export const workforceTrainingData = {
  // Company Information
  company: {
    name: "SecureGuard Property Services",
    industry: "Property Management & Security",
    location: "Mumbai, Maharashtra, India",
    founded: "2018",
    employees: "250+",
    properties: "45+ residential & commercial properties",
    website: "www.secureguardproperties.com",
  },

  // Shift & Schedule Information
  shifts: {
    standard: "8 hours per day, 48 hours per week",
    types: [
      { name: "Morning Shift", time: "6:00 AM - 2:00 PM" },
      { name: "Afternoon Shift", time: "2:00 PM - 10:00 PM" },
      { name: "Night Shift", time: "10:00 PM - 6:00 AM" },
      { name: "General Shift", time: "9:00 AM - 6:00 PM (Office Staff)" },
    ],
    weeklyOff: "1 day per week (rotating)",
    overtime: "Approved by manager, paid at 2x regular rate for hours beyond 48/week",
    swapPolicy: "Shift swaps allowed with 48 hours notice and manager approval",
    latePolicy: "3 late arrivals in a month = written warning, 5 = termination",
    breakPolicy: "30-minute unpaid lunch break for 8-hour shifts",
  },

  // Time-Off & Leave Policy
  timeOff: {
    vacation: "12 days per year (1 day per month, accrues monthly)",
    sickLeave: "10 days per year (requires medical certificate for 3+ days)",
    casualLeave: "5 days per year (personal emergencies)",
    emergencyLeave: "Up to 3 days (unpaid, manager approval required)",
    maternityLeave: "26 weeks (as per Indian law, for female employees)",
    paternityLeave: "15 days (for male employees)",
    bereavementLeave: "3 days (immediate family)",
    requestProcess: "Submit via employee portal or WhatsApp to manager at least 7 days in advance",
    approvalTime: "Manager responds within 24-48 hours",
    peakSeason: "No vacation during Diwali, Christmas, New Year (Nov-Jan) without emergency",
  },

  // Payroll & Compensation
  payroll: {
    schedule: "Monthly (1st of every month)",
    method: "Direct deposit to bank account",
    payslipAccess: "Employee portal or WhatsApp request to HR",
    salaryStructure: "Basic + HRA + Special Allowance + Overtime (if applicable)",
    overtimeRate: "2x regular hourly rate for hours beyond 48 hours/week",
    bonus: "Annual performance bonus (1 month salary) based on appraisal",
    increment: "Annual salary review (April)",
    deductions: "PF (12%), Professional Tax (₹200/month), TDS (if applicable)",
    advance: "Salary advance up to 50% of monthly salary (emergency only, HR approval)",
  },

  // Benefits & Perks
  benefits: {
    healthInsurance: "₹3 lakhs coverage for employee + family (after 3 months)",
    accidentInsurance: "₹5 lakhs coverage (all employees)",
    pf: "Provident Fund (12% of basic salary)",
    gratuity: "Eligible after 5 years of continuous service",
    uniform: "Free uniform provided (2 sets)",
    food: "Free lunch/dinner during shift (for security guards)",
    transport: "Pickup & drop facility for night shift employees",
    festivalBonus: "₹2,000 during Diwali",
    referralBonus: "₹3,000 for successful employee referral",
    training: "Free security training & certification",
  },

  // Contact Information
  contacts: {
    hr: {
      email: "hr@secureguardproperties.com",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      officeHours: "Mon-Sat, 9 AM - 6 PM",
    },
    manager: {
      email: "operations@secureguardproperties.com",
      phone: "+91 98765 43211",
    },
    emergency: {
      phone: "+91 98765 43212 (24/7)",
      email: "emergency@secureguardproperties.com",
    },
    itSupport: {
      email: "it@secureguardproperties.com",
      phone: "+91 98765 43213",
    },
    payroll: {
      email: "payroll@secureguardproperties.com",
      phone: "+91 98765 43214",
    },
  },

  // Policies & Rules
  policies: {
    dressCode: "Company uniform must be worn at all times during shift. Clean and professional appearance required.",
    phonePolicy: "Personal phone use not allowed during duty hours. Emergency calls only with supervisor permission.",
    attendance: "Biometric attendance or WhatsApp check-in required. 3 unexcused absences = termination.",
    probationPeriod: "3 months probation, confirmation based on performance review",
    noticePeriod: "30 days notice for resignation (or 1 month salary in lieu)",
    termination: "Immediate termination for theft, violence, harassment, or 5 unexcused absences",
    gdpr: "Employee data is confidential and protected",
    harassment: "Zero tolerance for harassment. Report to HR immediately.",
    socialMedia: "Do not post company or client information on social media",
    moonlighting: "Second job not allowed without written approval",
  },

  // Onboarding Information
  onboarding: {
    documents: [
      "Aadhar Card",
      "PAN Card",
      "10th/12th Mark Sheet",
      "Previous Experience Letters (if any)",
      "2 Passport Photos",
      "Bank Account Details",
      "Medical Fitness Certificate",
    ],
    orientation: "1-day orientation on Day 1 (company policies, safety, client interaction)",
    training: "7-day security training (unpaid) + 15-day on-job training (paid)",
    buddy: "Senior guard assigned as buddy for first 2 weeks",
    reportingDay1: "Report to HR office at 9 AM with all documents",
    portalAccess: "Credentials provided on Day 2",
    uniformDistribution: "Day 1 after document verification",
  },

  // Performance & Career
  performance: {
    reviews: "Quarterly performance reviews",
    kpi: [
      "Attendance (25%)",
      "Client feedback (25%)",
      "Incident reports (20%)",
      "Teamwork (15%)",
      "Initiative (15%)",
    ],
    promotion: "Promotions based on performance + 1 year minimum in current role",
    careerPath: "Guard → Senior Guard → Supervisor → Assistant Manager → Property Manager",
    training: "Free certification courses: Security Guard License, Fire Safety, First Aid",
    transfer: "Inter-property transfers allowed based on business needs + employee preference",
  },

  // Safety & Emergency
  safety: {
    emergencyProcedures: "Call emergency number + inform manager immediately",
    fireSafety: "All staff trained in fire safety. Evacuation routes posted at each property",
    firstAid: "First aid kits available at all properties. 2 staff per shift trained in first aid",
    incidentReporting: "Report all incidents via WhatsApp to manager within 1 hour",
    ppe: "Safety shoes, torch, raincoat provided free",
    cctv: "All properties under CCTV surveillance",
    panicButton: "Panic button on company mobile app for emergencies",
  },

  // Technology & Tools
  technology: {
    attendanceApp: "SecureGuard Attendance App (Android)",
    communicationApp: "WhatsApp group for each property",
    incidentReporting: "WhatsApp + email to manager",
    employeePortal: "portal.secureguardproperties.com",
    mobileApp: "SecureGuard Employee App (for schedules, payslips, requests)",
    training: "Online training modules on employee portal",
  },

  // Common Scenarios (Q&A Examples)
  qaExamples: [
    {
      question: "What are my shift timings?",
      answer: "Standard shifts are 8 hours. We have Morning (6 AM - 2 PM), Afternoon (2 PM - 10 PM), Night (10 PM - 6 AM), and General (9 AM - 6 PM for office staff). Your specific shift is mentioned in your offer letter and schedule.",
    },
    {
      question: "How do I request time off?",
      answer: "Submit your leave request via the employee portal or send a WhatsApp message to your manager at least 7 days in advance. Manager will approve within 24-48 hours. For emergencies, call immediately.",
    },
    {
      question: "When do I get paid?",
      answer: "Salary is credited on the 1st of every month via direct deposit. If 1st is a Sunday or holiday, salary is credited on the last working day of previous month.",
    },
    {
      question: "What is the overtime policy?",
      answer: "Overtime must be pre-approved by your manager. You get paid 2x your regular hourly rate for hours worked beyond 48 hours per week. Overtime is calculated monthly and paid with salary.",
    },
    {
      question: "How many vacation days do I have?",
      answer: "You get 12 vacation days per year (1 day per month). Vacation accrues monthly, so after 6 months you have 6 days available. Request at least 7 days in advance.",
    },
    {
      question: "Who do I contact for payroll issues?",
      answer: "For salary, payslip, or deduction queries, email payroll@secureguardproperties.com or call +91 98765 43214. HR is also available at hr@secureguardproperties.com.",
    },
    {
      question: "Can I swap my shift with a colleague?",
      answer: "Yes, shift swaps are allowed with 48 hours notice and manager approval. Both employees must agree. Send a WhatsApp message to your manager with both names and dates.",
    },
    {
      question: "What happens if I'm late?",
      answer: "Late arrivals are recorded. 3 late arrivals in a month = written warning. 5 late arrivals = termination. If you're running late, inform your manager immediately.",
    },
    {
      question: "Do you provide health insurance?",
      answer: "Yes! After 3 months, you get ₹3 lakhs health insurance for yourself and family. You also get ₹5 lakhs accident insurance from Day 1.",
    },
    {
      question: "How do I check my payslip?",
      answer: "Login to the employee portal (portal.secureguardproperties.com) with your credentials. Payslips are available under 'Payroll' section by the 5th of every month.",
    },
  ],
};

// Helper function to get all training text as a single string
export function getTrainingText(): string {
  return `
WORKFORCE ASSISTANT TRAINING DATA FOR ${workforceTrainingData.company.name}

=== COMPANY INFORMATION ===
Company: ${workforceTrainingData.company.name}
Industry: ${workforceTrainingData.company.industry}
Location: ${workforceTrainingData.company.location}
Founded: ${workforceTrainingData.company.founded}
Employees: ${workforceTrainingData.company.employees}
Properties: ${workforceTrainingData.company.properties}
Website: ${workforceTrainingData.company.website}

=== SHIFT POLICY ===
Standard Hours: ${workforceTrainingData.shifts.standard}
Shift Types: ${workforceTrainingData.shifts.types.map(s => `${s.name} (${s.time})`).join(", ")}
Weekly Off: ${workforceTrainingData.shifts.weeklyOff}
Overtime: ${workforceTrainingData.shifts.overtime}
Shift Swap: ${workforceTrainingData.shifts.swapPolicy}
Late Policy: ${workforceTrainingData.shifts.latePolicy}
Break Policy: ${workforceTrainingData.shifts.breakPolicy}

=== TIME-OFF POLICY ===
Vacation: ${workforceTrainingData.timeOff.vacation}
Sick Leave: ${workforceTrainingData.timeOff.sickLeave}
Casual Leave: ${workforceTrainingData.timeOff.casualLeave}
Emergency Leave: ${workforceTrainingData.timeOff.emergencyLeave}
Maternity Leave: ${workforceTrainingData.timeOff.maternityLeave}
Paternity Leave: ${workforceTrainingData.timeOff.paternityLeave}
Bereavement Leave: ${workforceTrainingData.timeOff.bereavementLeave}
Request Process: ${workforceTrainingData.timeOff.requestProcess}
Approval Time: ${workforceTrainingData.timeOff.approvalTime}
Peak Season Restriction: ${workforceTrainingData.timeOff.peakSeason}

=== PAYROLL ===
Pay Schedule: ${workforceTrainingData.payroll.schedule}
Payment Method: ${workforceTrainingData.payroll.method}
Payslip Access: ${workforceTrainingData.payroll.payslipAccess}
Salary Structure: ${workforceTrainingData.payroll.salaryStructure}
Overtime Rate: ${workforceTrainingData.payroll.overtimeRate}
Bonus: ${workforceTrainingData.payroll.bonus}
Increment: ${workforceTrainingData.payroll.increment}
Deductions: ${workforceTrainingData.payroll.deductions}
Salary Advance: ${workforceTrainingData.payroll.advance}

=== BENEFITS ===
Health Insurance: ${workforceTrainingData.benefits.healthInsurance}
Accident Insurance: ${workforceTrainingData.benefits.accidentInsurance}
PF: ${workforceTrainingData.benefits.pf}
Gratuity: ${workforceTrainingData.benefits.gratuity}
Uniform: ${workforceTrainingData.benefits.uniform}
Food: ${workforceTrainingData.benefits.food}
Transport: ${workforceTrainingData.benefits.transport}
Festival Bonus: ${workforceTrainingData.benefits.festivalBonus}
Referral bonus: ${workforceTrainingData.benefits.referralBonus}
Training: ${workforceTrainingData.benefits.training}

=== CONTACTS ===
HR: ${workforceTrainingData.contacts.hr.email} | ${workforceTrainingData.contacts.hr.phone}
Manager: ${workforceTrainingData.contacts.manager.email} | ${workforceTrainingData.contacts.manager.phone}
Emergency: ${workforceTrainingData.contacts.emergency.phone} (24/7)
IT Support: ${workforceTrainingData.contacts.itSupport.email}
Payroll: ${workforceTrainingData.contacts.payroll.email} | ${workforceTrainingData.contacts.payroll.phone}

=== POLICIES ===
Dress Code: ${workforceTrainingData.policies.dressCode}
Phone Policy: ${workforceTrainingData.policies.phonePolicy}
Attendance: ${workforceTrainingData.policies.attendance}
Probation: ${workforceTrainingData.policies.probationPeriod}
Notice Period: ${workforceTrainingData.policies.noticePeriod}
Termination: ${workforceTrainingData.policies.termination}
Harassment: ${workforceTrainingData.policies.harassment}
Social Media: ${workforceTrainingData.policies.socialMedia}
Moonlighting: ${workforceTrainingData.policies.moonlighting}

=== ONBOARDING ===
Required Documents: ${workforceTrainingData.onboarding.documents.join(", ")}
Orientation: ${workforceTrainingData.onboarding.orientation}
Training: ${workforceTrainingData.onboarding.training}
Buddy System: ${workforceTrainingData.onboarding.buddy}
Day 1 Reporting: ${workforceTrainingData.onboarding.reportingDay1}
Portal Access: ${workforceTrainingData.onboarding.portalAccess}
Uniform: ${workforceTrainingData.onboarding.uniformDistribution}

=== PERFORMANCE ===
Review Frequency: ${workforceTrainingData.performance.reviews}
KPIs: ${workforceTrainingData.performance.kpi.join(", ")}
Promotion Criteria: ${workforceTrainingData.performance.promotion}
Career Path: ${workforceTrainingData.performance.careerPath}
Training Programs: ${workforceTrainingData.performance.training}
Transfer Policy: ${workforceTrainingData.performance.transfer}

=== SAFETY ===
Emergency Procedure: ${workforceTrainingData.safety.emergencyProcedures}
Fire Safety: ${workforceTrainingData.safety.fireSafety}
First Aid: ${workforceTrainingData.safety.firstAid}
Incident Reporting: ${workforceTrainingData.safety.incidentReporting}
PPE Provided: ${workforceTrainingData.safety.ppe}
CCTV: ${workforceTrainingData.safety.cctv}
Panic Button: ${workforceTrainingData.safety.panicButton}

=== TECHNOLOGY ===
Attendance App: ${workforceTrainingData.technology.attendanceApp}
Communication: ${workforceTrainingData.technology.communicationApp}
Incident Reporting: ${workforceTrainingData.technology.incidentReporting}
Employee Portal: ${workforceTrainingData.technology.employeePortal}
Mobile App: ${workforceTrainingData.technology.mobileApp}
Training Platform: ${workforceTrainingData.technology.training}

=== EXAMPLE Q&A PAIRS ===
${workforceTrainingData.qaExamples.map((ex, i) => `
Q${i + 1}: ${ex.question}
A${i + 1}: ${ex.answer}
`).join("\n")}

=== ORGANIZATIONAL AUTOMATION CAPABILITIES ===

RECRUITING & HIRING AUTOMATION:
- Job posting automation across multiple platforms
- Resume screening and candidate ranking
- Interview scheduling and coordination
- Candidate communication and follow-ups
- Background check coordination
- Offer letter generation
- Onboarding workflow automation
- Applicant tracking system (ATS) integration

SALES AUTOMATION:
- Lead scoring and qualification
- CRM data entry and updates
- Email sequence automation
- Follow-up reminders and scheduling
- Proposal generation
- Contract preparation
- Sales pipeline management
- Meeting scheduling and coordination

MARKETING AUTOMATION:
- Social media scheduling and posting
- Email campaign management
- Content calendar planning
- Analytics and reporting
- Ad campaign optimization
- Landing page creation
- A/B testing coordination
- Marketing funnel optimization

LEAD GENERATION:
- Lead scraping and enrichment
- Contact verification
- Lead segmentation
- Personalized outreach
- Lead nurturing sequences
- Demo booking automation
- Qualification questionnaires
- Lead handoff to sales

=== MAJOR CHALLENGES WE SOLVE ===

PROBLEM 1: MANUAL DATA ENTRY
- Old way: Sales reps spend 3 hours/day entering data in CRM
- Our solution: Automatic CRM updates from emails, calls, meetings
- Result: 15 hours/week saved per rep

PROBLEM 2: SLOW LEAD RESPONSE
- Old way: Leads wait 24-48 hours for first contact
- Our solution: Instant AI-powered response in <5 minutes
- Result: 7x higher conversion rate

PROBLEM 3: INEFFICIENT RECRUITING
- Old way: 2-3 weeks to fill a position
- Our solution: Automated screening + scheduling fills in 5 days
- Result: 60% faster hiring, 45% cost reduction

PROBLEM 4: GENERIC OUTREACH
- Old way: Copy-paste templates, 2% response rate
- Our solution: AI-personalized messages, 15% response rate
- Result: 7.5x more responses

PROBLEM 5: MISSED FOLLOW-UPS
- Old way: 40% of leads fall through cracks
- Our solution: Automated follow-up sequences
- Result: 95% follow-up rate, 30% more deals closed

=== SAMPLE CONVERSATIONS ===

Q: How can you automate recruiting?
A: I can automate your entire recruiting workflow:
• Post jobs to 10+ platforms automatically
• Screen resumes and rank candidates
• Schedule interviews based on availability
• Send personalized candidate communications
• Coordinate background checks
• Generate offer letters
• Manage onboarding checklists
Result: 60% faster hiring, 45% cost reduction.

Q: Can you help with lead generation?
A: Absolutely! I automate lead gen end-to-end:
• Scrape and enrich leads from LinkedIn, websites
• Verify contact information
• Score and segment leads
• Send personalized outreach sequences
• Book meetings automatically
• Qualify and route to sales reps
• Track engagement and optimize
Result: 10x more leads, 65% lower cost per lead.

Q: What sales tasks can you automate?
A: I handle repetitive sales tasks so you can sell:
• CRM data entry (automatic from emails/calls)
• Lead scoring and prioritization
• Email sequence creation and sending
• Follow-up reminders
• Meeting scheduling
• Proposal generation
• Contract preparation
• Pipeline updates
Result: 15 hours/week saved, 25% more deals closed.

Q: What's the ROI?
A: Typical customer results in 90 days:
• Recruiting: 60% faster hiring, $15K saved per hire
• Sales: 25% more deals, 15 hours/week saved per rep
• Marketing: 3x content output, 50% better lead quality
• Lead Gen: 10x more leads, 65% lower cost
• Overall: 5-10x ROI within first quarter

=== RESPONSE STYLE ===

- Be professional but friendly
- Use bullet points for clarity
- Include specific numbers and metrics
- Focus on outcomes, not features
- Address objections proactively
- Keep responses concise (3-5 sentences max)
- Use emojis sparingly (1-2 per message)
- If you don't know something, say "Let me connect you with our team"
- For workforce questions, use SecureGuard policies above
- For automation questions, use organizational capabilities above
`;
}

// Export training data as a simple string for AI agent
export const trainingData = getTrainingText();