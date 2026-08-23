import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

export const EventRegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();

  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [form, setForm] = useState<EventForm | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  // Load Event, Form and check server-authoritative submission status
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [eventRes, formsRes, subsRes] = await Promise.all([
          eventService.getEventById(id),
          formService.getFormsByEvent(id),
          isAuthenticated
            ? formService.getMySubmissions().catch(() => ({ submissions: [] }))
            : Promise.resolve({ submissions: [] }),
        ]);

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
          }

          // Initialize answer defaults
          const initialAnswers: Record<string, any> = {};
          (attachedForm.schema?.fields || []).forEach((field) => {
            if (field.name === 'email' && profile?.email) {
              initialAnswers[field.name] = profile.email;
            } else if (field.name === 'full_name' && profile?.full_name) {
              initialAnswers[field.name] = profile.full_name;
            } else {
              initialAnswers[field.name] = field.type === 'checkbox' ? false : '';
            }
          });
          setAnswers(initialAnswers);
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
  }, [id, isAuthenticated, navigate, profile]);

  const fields = form?.schema?.fields || [];
  const details = event?.details || {};

  const regState = useMemo(() => {
    if (!form) return 'hidden';
    return getEventRegistrationState({
      isRegistered,
      expiresAt: form.expires_at || form.schema?.expires_at,
    });
  }, [form, isRegistered]);

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

      if (field.required && !isProvided) {
        errors[field.name] = `${field.label} is required`;
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
      await formService.submitForm(form.id, answers);
      setIsRegistered(true);
      setSubmittedAt(new Date().toISOString());
      setIsSuccess(true);

      toast({
        title: 'Registration Confirmed',
        description: `You have successfully registered for "${event?.title}".`,
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

      if (res.action_required === 'CONNECT_GOOGLE_CALENDAR') {
        const { url } = await eventService.getGoogleLinkUrl();
        if (url) window.location.href = url;
        return;
      }

      if (res.success) {
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

  // Already Registered View (Server-Authoritative)
  if (isRegistered || isSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto space-y-6">
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Event Details</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl border border-google-green/30 bg-card text-card-foreground shadow-xl text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-google-green/10 text-google-green flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
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

            <div className="p-4 rounded-2xl bg-muted/50 border border-border text-xs text-left space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Calendar className="w-4 h-4 text-google-blue" />
                <span>{formatEventDate(details.startTime || details.start_time)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-google-yellow" />
                <span>
                  {formatEventTimeRange(
                    details.startTime || details.start_time,
                    details.endTime || details.end_time
                  )}
                </span>
              </div>
              {(details.location || details.venue) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-google-red" />
                  <span>{details.location || details.venue}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isCalendarLoading}
                onClick={handleAddToCalendar}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-background hover:bg-muted font-semibold text-xs transition-all shadow-sm"
              >
                <CalendarPlus className="w-4 h-4 text-google-yellow" />
                <span>Add to Google Calendar</span>
              </button>
              <Link
                to="/events"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <span>Browse More Events</span>
              </Link>
            </div>
          </motion.div>
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

                  {/* Dropdown Select */}
                  {field.type === 'select' && (
                    <select
                      value={answers[field.name] || ''}
                      onChange={(e) => handleAnswerChange(field.name, e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                        fieldError
                          ? 'border-destructive focus:ring-destructive/30'
                          : 'border-input focus:ring-google-blue/30 focus:border-google-blue'
                      }`}
                    >
                      <option value="">-- Select an option --</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

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

            {/* Submit Button */}
            <div className="pt-4 border-t border-border">
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
                    <span>Submitting Registration...</span>
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
