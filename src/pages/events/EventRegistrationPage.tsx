import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CalendarPlus,
  ArrowRight,
  Sparkles,
  Loader2,
  Mail,
  MailCheck,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { formService } from '@/services/formService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  type ClubEvent,
  type EventForm,
  type FormField,
  getEventRegistrationState,
  formatEventDate,
  formatEventTimeRange,
} from '@/lib/formUtils';
import EventTicketPass from '@/components/events/EventTicketPass';
import { SearchableSelect } from '@/components/common/SearchableSelect';

// Helper to autofill default form answers from user's completed profile
const getDefaultFieldValue = (field: FormField, profile: any) => {
  if (!profile) return field.type === 'checkbox' ? false : '';
  const details = profile.details || {};
  const fieldKey = (field.name || '').toLowerCase().trim();
  const fieldLabel = (field.label || '').toLowerCase().trim();

  // 1. Email matching
  if (
    field.type === 'email' ||
    fieldKey === 'email' ||
    fieldKey === 'attendee_email' ||
    fieldKey === 'student_email' ||
    fieldKey === 'email_id' ||
    fieldLabel.includes('email')
  ) {
    return details.email || profile.email || '';
  }

  // 2. Name matching
  if (
    fieldKey === 'full_name' ||
    fieldKey === 'fullname' ||
    fieldKey === 'name' ||
    fieldKey === 'attendee_name' ||
    fieldKey === 'student_name' ||
    (fieldLabel.includes('name') && !fieldLabel.includes('college') && !fieldLabel.includes('parent'))
  ) {
    return profile.full_name || '';
  }

  // 3. Roll Number / Register Number matching
  if (
    fieldKey === 'roll_no' ||
    fieldKey === 'roll_number' ||
    fieldKey === 'rollno' ||
    fieldKey === 'register_number' ||
    fieldKey === 'reg_no' ||
    fieldKey === 'regno' ||
    fieldKey === 'registration_number' ||
    fieldLabel.includes('roll') ||
    fieldLabel.includes('reg no') ||
    fieldLabel.includes('register number') ||
    fieldLabel.includes('registration number')
  ) {
    return details.roll_no || '';
  }

  // 4. Department / Branch matching
  if (
    fieldKey === 'department' ||
    fieldKey === 'dept' ||
    fieldKey === 'branch' ||
    fieldLabel.includes('department') ||
    fieldLabel.includes('branch')
  ) {
    return details.department || '';
  }

  // 5. Year matching
  if (
    fieldKey === 'year' ||
    fieldKey === 'year_of_study' ||
    fieldKey === 'current_year' ||
    fieldLabel.includes('year of study') ||
    fieldLabel === 'year'
  ) {
    return details.year || '';
  }

  // 6. Phone number matching
  if (
    field.type === 'tel' ||
    fieldKey === 'phone' ||
    fieldKey === 'phone_number' ||
    fieldKey === 'mobile' ||
    fieldKey === 'mobile_number' ||
    fieldKey === 'contact' ||
    fieldLabel.includes('phone') ||
    fieldLabel.includes('mobile')
  ) {
    return details.phone_number || details.phone || '';
  }

  return field.type === 'checkbox' ? false : '';
};

export const EventRegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, isAuthenticated } = useAuth();

  const ticketParam = searchParams.get('ticket') || searchParams.get('ticket_id');

  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [form, setForm] = useState<EventForm | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isCalendarAdded, setIsCalendarAdded] = useState(false);
  const [confirmationEmailTo, setConfirmationEmailTo] = useState<string | null>(null);

  // Load Event, Form and check server-authoritative submission status
  useEffect(() => {
    if (!id) return;

    // Fast check for locally saved calendar sync
    try {
      if (localStorage.getItem(`gdg_calendar_added_${id}`) === 'true') {
        setIsCalendarAdded(true);
      }
    } catch (_) {}

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Priority 1: If URL contains a ticket parameter (from confirmation email), load pass directly
        if (ticketParam) {
          try {
            const ticketRes = await formService.getTicketPass(ticketParam);
            if (ticketRes?.submission) {
              setEvent(ticketRes.event || (await eventService.getEventById(id)).event);
              setForm(ticketRes.form);
              setIsRegistered(true);
              setSubmittedAt(ticketRes.submission.submitted_at);
              setSubmissionId(ticketRes.submission.id);
              const subAnswers = ticketRes.submission.answers || {};
              setAnswers({
                ...subAnswers,
                ticket_id: ticketRes.ticket_id || ticketParam,
              });
              setIsLoading(false);
              return;
            }
          } catch (ticketErr) {
            console.warn('Could not load ticket by ticket param:', ticketErr);
          }
        }

        const [eventRes, formsRes, subsRes, calRes] = await Promise.all([
          eventService.getEventById(id),
          formService.getFormsByEvent(id),
          isAuthenticated
            ? formService.getMySubmissions().catch(() => ({ submissions: [] }))
            : Promise.resolve({ submissions: [] }),
          isAuthenticated
            ? eventService.getMyCalendarEvents().catch(() => ({ event_ids: [] }))
            : Promise.resolve({ event_ids: [] }),
        ]);

        if (calRes?.event_ids && Array.isArray(calRes.event_ids) && calRes.event_ids.includes(id)) {
          setIsCalendarAdded(true);
        }

        setEvent(eventRes.event);

        if (formsRes.forms && formsRes.forms.length > 0) {
          const attachedForm = formsRes.forms[0];
          setForm(attachedForm);

          // Check if already registered
          const userSub = (subsRes.submissions || []).find(
            (s) => s.form_id === attachedForm.id
          );

          if (userSub) {
            setIsRegistered(true);
            setSubmittedAt(userSub.submitted_at);
            setSubmissionId(userSub.id);
            if (userSub.answers) {
              setAnswers(userSub.answers);
            }
          } else {
            // Initialize answer defaults from user profile only if not yet registered
            const initialAnswers: Record<string, any> = {};
            (attachedForm.schema?.fields || []).forEach((field) => {
              initialAnswers[field.name] = getDefaultFieldValue(field, profile);
            });
            setAnswers(initialAnswers);
          }
        }
      } catch (err: any) {
        toast({
          title: 'Error loading registration form',
          description: err.message || 'Could not load form.',
          variant: 'destructive',
        });
        navigate('/events');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isAuthenticated, navigate, profile, ticketParam]);

  // Reactive prefill: Populate any empty form answers whenever profile data hydrates
  useEffect(() => {
    if (!profile || isRegistered || !form?.schema?.fields) return;

    setAnswers((prev) => {
      let hasChanges = false;
      const nextAnswers = { ...prev };

      form.schema.fields.forEach((field) => {
        const currentVal = nextAnswers[field.name];
        if (currentVal === undefined || currentVal === '') {
          const autoVal = getDefaultFieldValue(field, profile);
          if (autoVal !== '' && autoVal !== false) {
            nextAnswers[field.name] = autoVal;
            hasChanges = true;
          }
        }
      });

      return hasChanges ? nextAnswers : prev;
    });
  }, [profile, isRegistered, form]);

  const fields = form?.schema?.fields || [];
  const details = event?.details || {};

  const regState = useMemo(() => {
    if (!form) return 'hidden';
    return getEventRegistrationState({
      isRegistered,
      expiresAt: form.expires_at || form.schema?.expires_at,
    });
  }, [form, isRegistered]);

  // Resolve submitted attendee email from form answers first (unconditional hook)
  const submittedEmail = useMemo(() => {
    if (answers.email && typeof answers.email === 'string') return answers.email;
    const emailField = fields.find(
      (f) => f.type === 'email' || (f.name && f.name.toLowerCase().includes('email'))
    );
    if (emailField && answers[emailField.name]) {
      return String(answers[emailField.name]);
    }
    return confirmationEmailTo || profile?.email || 'your email';
  }, [answers, fields, confirmationEmailTo, profile]);

  // Resolve submitted attendee name from form answers first (unconditional hook)
  const submittedName = useMemo(() => {
    if (answers.full_name && typeof answers.full_name === 'string') return answers.full_name;
    if (answers.name && typeof answers.name === 'string') return answers.name;
    const nameField = fields.find(
      (f) => f.name && (f.name.toLowerCase().includes('name') || f.label?.toLowerCase().includes('name'))
    );
    if (nameField && answers[nameField.name]) {
      return String(answers[nameField.name]);
    }
    return profile?.full_name || 'Attendee';
  }, [answers, fields, profile]);

  // Answer change handler
  const handleAnswerChange = (fieldName: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }));
    if (formErrors[fieldName]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // Client-side validation
  const validate = () => {
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
      const val = answers[field.name];
      const isProvided = val !== undefined && val !== null && val !== '';

      const isBlankOther = val === 'Other' || val === 'Other: ';
      if (field.required && (!isProvided || isBlankOther)) {
        errors[field.name] = isBlankOther
          ? `Please specify your ${field.label.toLowerCase()}`
          : `${field.label} is required`;
        return;
      }

      if (isProvided) {
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors[field.name] = 'Please enter a valid email address';
        }
        if (field.minLength && String(val).length < field.minLength) {
          errors[field.name] = `Must be at least ${field.minLength} characters`;
        }
        if (field.maxLength && String(val).length > field.maxLength) {
          errors[field.name] = `Must not exceed ${field.maxLength} characters`;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!form) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const submitRes = await formService.submitForm(form.id, answers);
      if (submitRes?.submission?.id) {
        setSubmissionId(submitRes.submission.id);
      }
      if (submitRes?.submission?.answers) {
        setAnswers(submitRes.submission.answers);
      }
      if (submitRes?.confirmation_email_sent_to) {
        setConfirmationEmailTo(submitRes.confirmation_email_sent_to);
      }
      setIsRegistered(true);
      setSubmittedAt(submitRes?.submission?.submitted_at || new Date().toISOString());
      setIsSuccess(true);

      toast({
        title: 'Registration Confirmed 🎉',
        description: `You have registered for "${event?.title}". A confirmation email with your QR pass has been sent!`,
      });
    } catch (err: any) {
      if (err.status === 409) {
        setIsRegistered(true);
        toast({
          title: 'Already Registered',
          description: 'You have already submitted registration for this event.',
        });
      } else if (err.status === 410) {
        setServerError('Registration closed: The deadline to submit this form has passed.');
      } else {
        setServerError(err.message || 'An error occurred while submitting your registration.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!id) return;
    setIsCalendarLoading(true);
    try {
      const res = await eventService.createCalendarReminder(id);

      if (res.action_required === 'CONNECT_GOOGLE_CALENDAR' || res.action_required === 'RECONNECT_GOOGLE_CALENDAR') {
        const { url } = await eventService.getGoogleLinkUrl();
        if (url) window.location.href = url;
        return;
      }

      if (res.success || res.calendar_event_id) {
        setIsCalendarAdded(true);
        try {
          localStorage.setItem(`gdg_calendar_added_${id}`, 'true');
        } catch (_) {}
        toast({
          title: 'Added to Google Calendar',
          description: res.message || 'Check your primary Google Calendar.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Calendar error',
        description: err.message || 'Could not sync event to calendar.',
        variant: 'destructive',
      });
    } finally {
      setIsCalendarLoading(false);
    }
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading registration form...</p>
        </div>
      </div>
    );
  }

  // Feature Toggle: Set to true if you want to also show the QR pass directly on the website immediately after registering.
  // By default, attendees receive their QR pass via email, and see the full QR pass when clicking the link in the email.
  const SHOW_QR_PASS_DIRECTLY_ON_WEBSITE = false;

  const isFromEmailTicket = Boolean(ticketParam);

  // Already Registered View (Server-Authoritative)
  if (isRegistered || isSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Event Details</span>
          </Link>

          {/* Website Confirmation Banners — Only displayed when registering on website, HIDDEN when viewing pass from email */}
          {!isFromEmailTicket && (
            <>
              {/* Success Header Banner */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl border border-google-green/30 bg-card text-card-foreground shadow-lg text-center space-y-3"
              >
                <div className="w-14 h-14 rounded-full bg-google-green/10 text-google-green flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-bold font-sans">You are Registered!</h1>
                  <p className="text-sm text-muted-foreground">
                    Your registration for <strong className="text-foreground">{event.title}</strong> is confirmed.
                  </p>
                  {submittedAt && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Registered on{' '}
                      {new Date(submittedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Confirmation Email Alert Notice */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-google-blue/10 border border-google-blue/30 text-foreground flex items-start gap-3.5 shadow-sm overflow-hidden"
              >
                <div className="w-8 h-8 rounded-full bg-google-blue/20 text-google-blue flex items-center justify-center shrink-0 mt-0.5">
                  <MailCheck className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs min-w-0 flex-1">
                  <p className="font-bold text-google-blue text-sm">Confirmation Email Sent</p>
                  <p className="text-muted-foreground leading-relaxed break-words [overflow-wrap:anywhere]">
                    An automated confirmation email with your official event pass and check-in QR code has been dispatched to{' '}
                    <strong className="text-foreground font-semibold break-all [word-break:break-all]">
                      {submittedEmail}
                    </strong>. Please check your inbox to view and download your pass.
                  </p>
                </div>
              </motion.div>
            </>
          )}

          {/* QR Code Ticket Pass Card:
              - Visible when opened through the link in the email (?ticket=...)
              - Disabled on website registration by default (set SHOW_QR_PASS_DIRECTLY_ON_WEBSITE = true to enable anytime)
          */}
          {(isFromEmailTicket || SHOW_QR_PASS_DIRECTLY_ON_WEBSITE) && (
            <EventTicketPass
              event={event}
              submissionId={submissionId || undefined}
              submittedAt={submittedAt}
              answers={answers}
              fields={fields}
              attendeeName={submittedName}
              attendeeEmail={submittedEmail}
            />
          )}

          {/* Additional Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={isCalendarLoading || isCalendarAdded}
              onClick={handleAddToCalendar}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-semibold text-xs transition-all shadow-sm ${
                isCalendarAdded
                  ? 'border-google-green/40 bg-google-green/10 text-google-green cursor-default'
                  : 'border-border bg-card hover:bg-muted text-foreground'
              }`}
            >
              {isCalendarLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-google-blue" />
                  <span>Adding to Calendar...</span>
                </>
              ) : isCalendarAdded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-google-green" />
                  <span>Added to Google Calendar ✓</span>
                </>
              ) : (
                <>
                  <CalendarPlus className="w-4 h-4 text-google-yellow" />
                  <span>Add to Google Calendar</span>
                </>
              )}
            </button>
            <Link
              to="/events"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <span>Browse More Events</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registration Closed View
  if (regState === 'closed' || regState === 'hidden') {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto space-y-6">
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Event</span>
          </Link>

          <div className="p-8 rounded-3xl border border-google-yellow/30 bg-card text-card-foreground shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-google-yellow/10 text-google-yellow flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-sans">Registration Closed</h1>
            <p className="text-sm text-muted-foreground">
              The registration deadline for <strong>{event.title}</strong> has passed. You can still view event details or add a calendar reminder.
            </p>
            <div className="pt-2">
              <Link
                to={`/events/${id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                <span>View Event Details</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Breadcrumb Back */}
        <Link
          to={`/events/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event</span>
        </Link>

        {/* Event Header Banner */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm space-y-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-google-blue/10 text-google-blue border border-google-blue/20">
            {details.category || 'Workshop Registration'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-google-blue" />
              <span>{formatEventDate(details.startTime || details.start_time)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-google-yellow" />
              <span>
                {formatEventTimeRange(
                  details.startTime || details.start_time,
                  details.endTime || details.end_time
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Server Error Alert */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{serverError}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-lg space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-bold font-sans">{form?.title || 'Registration Form'}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Please complete all required fields below to reserve your spot.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field) => {
              const fieldError = formErrors[field.name];

              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground/90">
                    {field.label} {field.required && <span className="text-google-red">*</span>}
                  </label>

                  {/* Text Input */}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      placeholder={field.placeholder || ''}
                      value={answers[field.name] || ''}
                      onChange={(e) => handleAnswerChange(field.name, e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                        fieldError
                          ? 'border-destructive focus:ring-destructive/30'
                          : 'border-input focus:ring-google-blue/30 focus:border-google-blue'
                      }`}
                    />
                  )}

                  {/* Textarea Input */}
                  {field.type === 'textarea' && (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder || ''}
                      value={answers[field.name] || ''}
                      onChange={(e) => handleAnswerChange(field.name, e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                        fieldError
                          ? 'border-destructive focus:ring-destructive/30'
                          : 'border-input focus:ring-google-blue/30 focus:border-google-blue'
                      }`}
                    />
                  )}

                  {/* Email Input */}
                  {field.type === 'email' && (
                    <input
                      type="email"
                      placeholder={field.placeholder || 'your.email@example.com'}
                      value={answers[field.name] || ''}
                      onChange={(e) => handleAnswerChange(field.name, e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                        fieldError
                          ? 'border-destructive focus:ring-destructive/30'
                          : 'border-input focus:ring-google-blue/30 focus:border-google-blue'
                      }`}
                    />
                  )}

                  {/* Number Input */}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      placeholder={field.placeholder || ''}
                      value={answers[field.name] !== undefined ? answers[field.name] : ''}
                      onChange={(e) => handleAnswerChange(field.name, e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                        fieldError
                          ? 'border-destructive focus:ring-destructive/30'
                          : 'border-input focus:ring-google-blue/30 focus:border-google-blue'
                      }`}
                    />
                  )}

                  {/* Dropdown Select — uses SearchableSelect for proper mobile scroll behaviour */}
                  {field.type === 'select' && (() => {
                    const currentAnswer = String(answers[field.name] || '');
                    const fieldOptions: string[] = field.options || [];
                    const hasOtherOption = fieldOptions.includes('Other');
                    const isExplicitOther = currentAnswer.startsWith('Other: ') || currentAnswer === 'Other';
                    const isKnownOption = fieldOptions.includes(currentAnswer);
                    const showOtherInput = isExplicitOther || (!isKnownOption && currentAnswer !== '');
                    // The value fed into SearchableSelect must be one of the option values
                    const selectedValue = isKnownOption ? currentAnswer : (showOtherInput ? 'Other' : '');
                    const otherText = currentAnswer.startsWith('Other: ')
                      ? currentAnswer.replace('Other: ', '')
                      : (currentAnswer === 'Other' ? '' : (isKnownOption ? '' : currentAnswer));

                    // Build option list; append 'Other' if the field has options but no explicit Other
                    const selectOptions = hasOtherOption
                      ? fieldOptions
                      : [...fieldOptions, 'Other'];

                    return (
                      <div className="space-y-2">
                        <SearchableSelect
                          value={selectedValue}
                          onChange={(val) => {
                            if (val === 'Other') {
                              handleAnswerChange(field.name, 'Other: ');
                            } else {
                              handleAnswerChange(field.name, val);
                            }
                          }}
                          options={selectOptions}
                          placeholder="-- Select an option --"
                          error={Boolean(fieldError)}
                          accentColor="blue"
                        />

                        {showOtherInput && (
                          <div className="space-y-1 pl-0.5 animate-in fade-in duration-200">
                            <label className="block text-[11px] font-semibold text-muted-foreground">
                              Please specify your {field.label.toLowerCase()}:
                            </label>
                            <input
                              type="text"
                              required={field.required}
                              placeholder={`Enter your ${field.label.toLowerCase()}...`}
                              value={otherText}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleAnswerChange(field.name, val ? `Other: ${val}` : 'Other');
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Checkbox */}
                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`cb_${field.id}`}
                        checked={Boolean(answers[field.name])}
                        onChange={(e) => handleAnswerChange(field.name, e.target.checked)}
                        className="rounded border-input text-google-blue focus:ring-google-blue"
                      />
                      <label
                        htmlFor={`cb_${field.id}`}
                        className="text-xs text-foreground/80 font-medium cursor-pointer"
                      >
                        I agree / confirm
                      </label>
                    </div>
                  )}

                  {fieldError && <p className="text-xs text-destructive mt-1">{fieldError}</p>}
                </div>
              );
            })}

            {/* Confirmation Email Notice */}
            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/70 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="w-7 h-7 rounded-full bg-google-blue/10 text-google-blue flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="leading-normal">
                You will automatically receive a confirmation email with your digital check-in QR pass after registering.
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #4285F4, #1A73E8)',
                  boxShadow: '0 4px 20px rgba(66, 133, 244, 0.35)',
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Registration & Sending Pass...</span>
                  </div>
                ) : (
                  <>
                    <span>Confirm Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationPage;
