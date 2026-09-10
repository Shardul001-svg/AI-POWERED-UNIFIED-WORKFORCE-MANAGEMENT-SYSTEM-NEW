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
    {
      question: "What is the dress code?",
      answer: "Company uniform must be worn at all times during shift. Keep it clean and professional. Safety shoes are mandatory. Grooming standards: clean-shaven or trimmed beard, neat hair.",
    },
    {
      question: "Can I use my phone during work?",
      answer: "Personal phone use is not allowed during duty hours. You can use it during your 30-minute break. For emergencies, ask supervisor permission.",
    },
    {
      question: "How do I report an incident?",
      answer: "Report all incidents via WhatsApp to your manager within 1 hour. Also send an email to operations@secureguardproperties.com with details: time, location, what happened, actions taken.",
    },
    {
      question: "What documents do I need on my first day?",
      answer: "Bring: Aadhar Card, PAN Card, 10th/12th Mark Sheet, Previous Experience Letters (if any), 2 Passport Photos, Bank Account Details, Medical Fitness Certificate.",
    },
    {
      question: "Is there a probation period?",
      answer: "Yes, 3 months probation. Your performance is reviewed at the end. Upon confirmation, you get a confirmation letter and become a permanent employee.",
    },
    {
      question: "What is the notice period?",
      answer: "30 days notice is required for resignation. If you can't serve notice, you need to pay 1 month salary in lieu. Resignation email goes to HR and your manager.",
    },
    {
      question: "Do you provide training?",
      answer: "Yes! Free 7-day security training + 15-day on-job training. Ongoing training: Fire Safety, First Aid, Customer Service. All certifications are free.",
    },
    {
      question: "How do I apply for a promotion?",
      answer: "Promotions are based on quarterly performance reviews. Minimum 1 year in current role required. Express interest to your manager during review. Openings are posted on portal.",
    },
    {
      question: "What if I need emergency leave?",
      answer: "Call your manager immediately. Emergency leave up to 3 days is allowed (unpaid). Submit formal request on portal when possible. Medical emergency needs doctor's certificate.",
    },
    {
      question: "Who is my manager?",
      answer: "Your manager's name and contact are in your offer letter. For most security staff, it's the Operations Manager. Contact: operations@secureguardproperties.com or +91 98765 43211.",
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
`;
}