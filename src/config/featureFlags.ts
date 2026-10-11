/**
 * Global Application Feature Flags
 * 
 * Toggle features on or off safely across the entire application without touching
 * individual component code.
 */

// Master switch for all Certificate buttons (Header, Student Dashboard, Admin Events, Submissions, Download buttons)
// Set to false to disable all certificate buttons. Change to true to re-enable them anytime.
export const ENABLE_CERTIFICATES = false;

// Master switch for Email + Password authentication (both Student and Admin)
// Set to false to disable email+password forms, providing a single unified screen with Google Auth only.
// Set to true to restore the multi-screen email+password login and signup systems.
export const ENABLE_EMAIL_PASSWORD_AUTH = false;
