export type Language = "en" | "hi" | "mr";

export type TranslationKeys = {
  // Navigation & Shell
  nav: {
    workspace: string;
    dashboard: string;
    employees: string;
    candidates: string;
    interviews: string;
    requests: string;
    workflows: string;
    notifications: string;
    chat: string;
    settings: string;
    signOut: string;
    signingOut: string;
    userProfile: string;
    settingsAndMore: string;
  };
  // Page Titles & Descriptions
  pages: {
    dashboardTitle: string;
    dashboardSubtitle: string;
    employeesTitle: string;
    employeesSubtitle: string;
    candidatesTitle: string;
    candidatesSubtitle: string;
    interviewsTitle: string;
    interviewsSubtitle: string;
    requestsTitle: string;
    requestsSubtitle: string;
    workflowsTitle: string;
    workflowsSubtitle: string;
    notificationsTitle: string;
    notificationsSubtitle: string;
    settingsTitle: string;
    settingsSubtitle: string;
    chatTitle: string;
    chatSubtitle: string;
  };
  // Common Actions & Controls
  actions: {
    save: string;
    saving: string;
    cancel: string;
    edit: string;
    delete: string;
    deleting: string;
    add: string;
    close: string;
    back: string;
    submit: string;
    submitting: string;
    search: string;
    filter: string;
    all: string;
    unread: string;
    read: string;
    markRead: string;
    markUnread: string;
    markAllRead: string;
    refresh: string;
    viewDetails: string;
    loading: string;
    error: string;
    success: string;
    noData: string;
  };
  // Settings Specific
  settings: {
    accountSection: string;
    accountDesc: string;
    appearanceSection: string;
    appearanceDesc: string;
    languageSection: string;
    languageDesc: string;
    securitySection: string;
    securityDesc: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailHelp: string;
    role: string;
    roleHelp: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    langEnglish: string;
    langHindi: string;
    langMarathi: string;
    profileUpdated: string;
    profileUpdateError: string;
    securityStatus: string;
    securityStatusVal: string;
    passwordInfo: string;
    activeSession: string;
    activeSessionVal: string;
  };
  // Status Labels
  statuses: {
    active: string;
    inactive: string;
    pending: string;
    approved: string;
    rejected: string;
    completed: string;
    todo: string;
    inProgress: string;
    applied: string;
    screening: string;
    interview: string;
    selected: string;
    scheduled: string;
    cancelled: string;
  };
  // Auth & Login
  auth: {
    welcomeBack: string;
    signInTitle: string;
    signInSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    signInButton: string;
    signingIn: string;
    askAdminNote: string;
    invalidCredentials: string;
    profileError: string;
  };
};

