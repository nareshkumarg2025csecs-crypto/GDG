import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  Home,
  CheckCircle2,
  AlertCircle,
  Eye,
  Image,
  Upload,
  UploadCloud,
  AlignLeft,
  X,
  Link as LinkIcon,
  List,
  Sparkles,
  ExternalLink,
  Code,
  TableProperties,
  Sliders,
  Check,
} from 'lucide-react';
import { stopLenis, startLenis } from '@/lib/scroll';
import { eventService } from '@/services/eventService';
import { formService } from '@/services/formService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import {
  type ClubEvent,
  type EventForm,
  type FormField,
  type FormSchema,
  type EventSection,
  type EventFieldType,
  formatEventDate,
  formatEventTimeRange,
} from '@/lib/formUtils';

const GOOGLE_THEME_COLORS = [
  { name: 'Google Blue', hex: '#4285F4' },
  { name: 'Google Red', hex: '#EA4335' },
  { name: 'Google Yellow', hex: '#FBBC04' },
  { name: 'Google Green', hex: '#34A853' },
  { name: 'Purple Neon', hex: '#A142F4' },
];

export const AdminEventEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Core Event Details State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Workshop');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [themeColor, setThemeColor] = useState(GOOGLE_THEME_COLORS[0].hex);
  const [isPublished, setIsPublished] = useState(false);

  // Flexible Custom Event Sections with Multiple Datatypes & Markdown Support
  const [customSections, setCustomSections] = useState<EventSection[]>([
    {
      id: 'sec_about',
      title: 'About the Event',
      type: 'markdown',
      content: 'Join us for an interactive session covering the latest in technology!\n\n### What you will learn:\n- Core concepts and best practices\n- Hands-on coding session\n- Q&A with tech experts',
    },
  ]);

  // Form & Expiration State
  const [hasForm, setHasForm] = useState(true);
  const [existingFormId, setExistingFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState(''); // Optional Google Sheets URL for auto-logging submissions
  const [formFields, setFormFields] = useState<FormField[]>([
    {
      id: 'f1',
      name: 'full_name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your full name',
    },
    {
      id: 'f2',
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'your.name@example.com',
    },
  ]);

  // Live Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Loading & Submitting
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Refs for datetime inputs and image uploader
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const expiryInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Image Quality & Size Settings
  const [imageQuality, setImageQuality] = useState<'original' | '2k' | 'hd'>('original');
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeKb: number; name: string } | null>(null);

  // Prevent background scroll when modal preview is open (Desktop & Mobile)
  useEffect(() => {
    if (showPreviewModal) {
      stopLenis();
      document.body.style.overflow = 'hidden';
    } else {
      startLenis();
      document.body.style.overflow = '';
    }
    return () => {
      startLenis();
      document.body.style.overflow = '';
    };
  }, [showPreviewModal]);

  // Convert uploaded image file to high-resolution, crystal-clear Base64 data URL without blur
  const processImageFile = (file: File, qualityPreset: 'original' | '2k' | 'hd' = imageQuality) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (PNG, JPEG, WebP, GIF).',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        let maxW = 2560; // Ultra high resolution default
        let maxH = 1440;
        let compressionQuality = 0.95;

        if (qualityPreset === '2k') {
          maxW = 2048;
          maxH = 1152;
          compressionQuality = 0.92;
        } else if (qualityPreset === 'hd') {
          maxW = 1440;
          maxH = 900;
          compressionQuality = 0.90;
        } else if (qualityPreset === 'original') {
          maxW = 3840; // 4K max ceiling to prevent crash while retaining 100% crispness
          maxH = 2160;
          compressionQuality = 0.96;
        }

        let { width, height } = img;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // High quality image smoothing algorithms
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const exportFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const base64Data = canvas.toDataURL(exportFormat, compressionQuality);
          const sizeKb = Math.round((base64Data.length * 3) / 4 / 1024);

          setBannerUrl(base64Data);
          setImageMeta({
            width,
            height,
            sizeKb,
            name: file.name,
          });

          toast({
            title: 'High-Res Poster Uploaded! 🖼️',
            description: `${width}×${height}px (${sizeKb} KB) • Crisp & blur-free.`,
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, imageQuality);
    }
  };

  // Load existing event data if editing
  useEffect(() => {
    if (!id) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const endTomorrow = new Date(tomorrow);
      endTomorrow.setHours(12, 30, 0, 0);

      const startIsoStr = tomorrow.toISOString().slice(0, 16);
      const endIsoStr = endTomorrow.toISOString().slice(0, 16);

      setStartTime(startIsoStr);
      setEndTime(endIsoStr);
      setExpiresAt(startIsoStr);
      return;
    }

    const fetchEventAndForm = async () => {
      setIsLoading(true);
      try {
        const { event } = await eventService.getEventById(id);
        const details = event.details || {};

        setTitle(event.title || '');
        setCategory(details.category || 'Workshop');
        setLocation(details.location || details.venue || '');
        setCapacity(details.capacity ? String(details.capacity) : '');
        setBannerUrl(details.banner_url || details.coverImage || details.cover_image || '');
        setThemeColor(details.theme_color || GOOGLE_THEME_COLORS[0].hex);
        setIsPublished(details.status === 'published' || details.published === true);

        if (details.custom_sections && Array.isArray(details.custom_sections)) {
          setCustomSections(details.custom_sections);
        } else if (details.description) {
          setCustomSections([
            {
              id: 'sec_about',
              title: 'About the Event',
              type: 'markdown',
              content: details.description,
            },
          ]);
        } else {
          setCustomSections([]);
        }

        if (details.startTime || details.start_time) {
          const startD = new Date(details.startTime || details.start_time);
          if (!isNaN(startD.getTime())) {
            setStartTime(startD.toISOString().slice(0, 16));
          }
        }

        if (details.endTime || details.end_time) {
          const endD = new Date(details.endTime || details.end_time);
          if (!isNaN(endD.getTime())) {
            setEndTime(endD.toISOString().slice(0, 16));
          }
        }

        // Fetch attached form
        try {
          const { forms } = await formService.getFormsByEvent(id);
          if (forms && forms.length > 0) {
            const form = forms[0];
            setExistingFormId(form.id);
            setFormTitle(form.title || '');
            setHasForm(true);

            if (form.expires_at || form.schema?.expires_at) {
              const expD = new Date(form.expires_at || form.schema?.expires_at);
              if (!isNaN(expD.getTime())) {
                setExpiresAt(expD.toISOString().slice(0, 16));
              }
            }

            if (form.schema?.fields && Array.isArray(form.schema.fields)) {
              setFormFields(form.schema.fields);
            }

            // Load existing Sheets URL if previously saved
            if (form.schema?.sheets_url) {
              setSheetsUrl(form.schema.sheets_url);
            }
          } else {
            setHasForm(false);
          }
        } catch {
          setHasForm(false);
        }
      } catch (err: any) {
        toast({
          title: 'Error loading event',
          description: err.message || 'Could not retrieve event details.',
          variant: 'destructive',
        });
        navigate('/admin/events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventAndForm();
  }, [id, navigate]);

  // Add custom section with specific datatype and renameable title
  const handleAddSection = (type: EventFieldType = 'markdown', defaultTitle?: string) => {
    const newSection: EventSection = {
      id: `sec_${Date.now()}`,
      title:
        defaultTitle ||
        (type === 'link' ? 'Useful Links' : type === 'list' ? 'Key Highlights' : 'New Section'),
      type,
      content: '',
      url: '',
      items: [],
    };
    setCustomSections([...customSections, newSection]);
  };

  const handleUpdateSection = (index: number, updated: Partial<EventSection>) => {
    const updatedList = [...customSections];
    updatedList[index] = { ...updatedList[index], ...updated };
    setCustomSections(updatedList);
  };

  // Allow deleting ANY custom section
  const handleRemoveSection = (index: number) => {
    setCustomSections(customSections.filter((_, i) => i !== index));
  };

  // Dynamic Form Field Handlers
  const handleAddField = () => {
    const newField: FormField = {
      id: `f_${Date.now()}`,
      name: `question_${formFields.length + 1}`,
      label: 'New Question',
      type: 'text',
      required: false,
      placeholder: '',
    };
    setFormFields([...formFields, newField]);
  };

  const handleUpdateField = (index: number, updated: Partial<FormField>) => {
    const updatedList = [...formFields];
    updatedList[index] = { ...updatedList[index], ...updated };
    if (updated.label && !updated.name) {
      updatedList[index].name = updated.label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 40);
    }
    setFormFields(updatedList);
  };

  // Allow deleting ANY form question
  const handleRemoveField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // Expiration presets
  const applyExpiryPreset = (preset: 'start' | '1day' | '2hours') => {
    if (!startTime) {
      toast({
        title: 'Set Start Time first',
        description: 'Please set the event start date and time.',
      });
      return;
    }
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) return;

    if (preset === 'start') {
      setExpiresAt(startDate.toISOString().slice(0, 16));
    } else if (preset === '1day') {
      const d = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      setExpiresAt(d.toISOString().slice(0, 16));
    } else if (preset === '2hours') {
      const d = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);
      setExpiresAt(d.toISOString().slice(0, 16));
    }
  };

  // Save Event & Form
  const handleSave = async (forcePublish?: boolean) => {
    setErrorBanner(null);

    if (!title.trim()) {
      setErrorBanner('Event title is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!startTime) {
      setErrorBanner('Event start date and time is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const targetPublished =
      forcePublish !== undefined ? forcePublish : isEditing ? isPublished : true;

    try {
      const primaryDescription =
        customSections.find((s) => s.content && s.content.trim())?.content ||
        customSections.map((s) => `${s.title}:\n${s.content}`).join('\n\n');

      const eventDetails = {
        description: primaryDescription.trim(),
        custom_sections: customSections,
        category: category.trim(),
        location: location.trim(),
        venue: location.trim(),
        banner_url: bannerUrl.trim() || undefined,
        coverImage: bannerUrl.trim() || undefined,
        theme_color: themeColor,
        startTime: new Date(startTime).toISOString(),
        start_time: new Date(startTime).toISOString(),
        endTime: endTime
          ? new Date(endTime).toISOString()
          : new Date(new Date(startTime).getTime() + 2 * 3600 * 1000).toISOString(),
        end_time: endTime
          ? new Date(endTime).toISOString()
          : new Date(new Date(startTime).getTime() + 2 * 3600 * 1000).toISOString(),
        capacity: capacity ? Number(capacity) : undefined,
        status: (targetPublished ? 'published' : 'draft') as 'draft' | 'published',
        published: targetPublished,
      };

      let savedEventId = id;

      if (isEditing && id) {
        await eventService.updateEvent(id, {
          title: title.trim(),
          details: eventDetails,
        });
      } else {
        const { event: createdEvent } = await eventService.createEvent({
          title: title.trim(),
          details: eventDetails,
        });
        savedEventId = createdEvent.id;
      }

      // Handle attached form
      if (hasForm && savedEventId) {
        const formSchema: FormSchema & { sheets_url?: string } = {
          fields: formFields,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        };
        if (sheetsUrl.trim()) {
          formSchema.sheets_url = sheetsUrl.trim();
        }

        const formPayload = {
          event_id: savedEventId,
          title: formTitle.trim() || `${title.trim()} Registration`,
          schema: formSchema,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        };

        if (existingFormId) {
          await formService.updateForm(existingFormId, {
            title: formPayload.title,
            schema: formPayload.schema,
            expires_at: formPayload.expires_at,
          });
        } else {
          await formService.createForm(formPayload);
        }
      }

      toast({
        title: targetPublished ? 'Event Published & Live!' : 'Event Saved as Draft',
        description: targetPublished
          ? `"${title}" is now visible to students on the events portal.`
          : `"${title}" has been saved as a draft.`,
      });

      navigate('/admin/events');
    } catch (err: any) {
      setErrorBanner(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/events"
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Admin Events"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Go to Homepage"
            >
              <Home className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-google-red">
                  {isEditing ? 'EDITING EVENT' : 'CREATE EVENT'}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {isPublished ? 'Status: Published' : 'Status: Draft'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-sans">
                {isEditing ? `Edit: ${title || 'Untitled'}` : 'New Custom Event'}
              </h1>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-google-blue" />
              <span>Live Preview</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="px-4 py-2 rounded-xl bg-google-green hover:bg-google-green/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing && isPublished ? 'Save Live Changes' : 'Publish Event'}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorBanner}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Core Event Essentials Card */}
        <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold font-sans flex items-center gap-2">
              <Calendar className="w-5 h-5 text-google-blue" />
              <span>Event Details</span>
            </h2>
            <span className="text-xs font-mono text-muted-foreground">General Info</span>
          </div>

          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
              Event Title <span className="text-google-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Google Cloud & AI Hackathon 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
            />
          </div>

          {/* Category, Venue & Theme Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Category / Track Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Workshop, Hackathon, AI/ML"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Venue / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Auditorium / Google Meet"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Theme Color Accent
              </label>
              <div className="flex items-center gap-2 pt-1">
                {GOOGLE_THEME_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    title={col.name}
                    onClick={() => setThemeColor(col.hex)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      themeColor === col.hex ? 'scale-125 ring-2 ring-foreground' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Date & Time Pickers with Visible Calendar Trigger Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Start Date & Time <span className="text-google-red">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  ref={startInputRef}
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                />
                <button
                  type="button"
                  onClick={() => startInputRef.current?.showPicker?.()}
                  className="absolute left-3 p-0.5 text-google-blue hover:scale-110 transition-transform"
                  title="Open Calendar Date Picker"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                End Date & Time
              </label>
              <div className="relative flex items-center">
                <input
                  ref={endInputRef}
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                />
                <button
                  type="button"
                  onClick={() => endInputRef.current?.showPicker?.()}
                  className="absolute left-3 p-0.5 text-google-yellow hover:scale-110 transition-transform"
                  title="Open Calendar Date Picker"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Event Banner / Poster Image (Upload Base64 or URL) */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-foreground/80">
                  Event Poster / Banner Image (Optional)
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Upload directly as crisp Base64 (zero storage bucket limits) or paste an image URL.
                </p>
              </div>

              {/* Quality Preset Selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60 self-start sm:self-auto">
                <span className="text-[10px] font-mono text-muted-foreground px-1.5 uppercase font-bold">Quality:</span>
                <button
                  type="button"
                  onClick={() => setImageQuality('original')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    imageQuality === 'original'
                      ? 'bg-card text-google-blue shadow-sm border border-google-blue/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Original resolution with high smoothing (sharpest)"
                >
                  Original (Lossless)
                </button>
                <button
                  type="button"
                  onClick={() => setImageQuality('2k')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    imageQuality === '2k'
                      ? 'bg-card text-google-blue shadow-sm border border-google-blue/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="2K Ultra HD (2048px max width)"
                >
                  2K HD
                </button>
                <button
                  type="button"
                  onClick={() => setImageQuality('hd')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    imageQuality === 'hd'
                      ? 'bg-card text-google-blue shadow-sm border border-google-blue/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Standard HD (1440px max width)"
                >
                  HD
                </button>
              </div>
            </div>

            {/* Hidden File Input for Base64 Image Upload */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileUpload}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* Upload Button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-google-blue/40 bg-google-blue/10 hover:bg-google-blue/20 text-google-blue text-xs sm:text-sm font-semibold transition-all shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Image ({imageQuality.toUpperCase()})</span>
              </button>

              {/* Or Paste URL */}
              <div className="sm:col-span-2 relative">
                <Image className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="Or paste image URL (https://...)"
                  value={bannerUrl.startsWith('data:') ? 'Base64 High-Res Image Loaded' : bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  readOnly={bannerUrl.startsWith('data:')}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                />
              </div>
            </div>

            {/* Live Banner Preview (Works with both Base64 Data URI & URL) */}
            {bannerUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-border h-48 sm:h-64 bg-black/40 group">
                <img
                  src={bannerUrl}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-4 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-google-green" />
                    <p className="text-white text-xs font-semibold font-mono">
                      {bannerUrl.startsWith('data:')
                        ? `Base64 Uploaded Poster ${imageMeta ? `(${imageMeta.width}×${imageMeta.height}px • ${imageMeta.sizeKb} KB)` : ''}`
                        : 'Image URL Preview'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBannerUrl('');
                        setImageMeta(null);
                      }}
                      className="p-1.5 rounded-lg bg-destructive/80 text-white hover:bg-destructive transition-colors"
                      title="Remove Poster"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Custom Fields / Sections with Any Datatype & Markdown Support */}
        <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-lg font-bold font-sans flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-google-green" />
                <span>Custom Content & Sections</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add any section with markdown, plain text, links, or bullet lists. You can delete any field.
              </p>
            </div>

            {/* Add Field / Section Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddSection('markdown', 'About the Event')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-google-green/10 text-google-green border border-google-green/30 text-xs font-semibold hover:bg-google-green/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Markdown Section</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddSection('markdown', 'Prerequisites & Eligibility')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-google-blue/10 text-google-blue border border-google-blue/30 text-xs font-semibold hover:bg-google-blue/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Prerequisites</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddSection('markdown', 'Event Schedule / Agenda')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-google-yellow/10 text-google-yellow border border-google-yellow/30 text-xs font-semibold hover:bg-google-yellow/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Schedule</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddSection('link', 'Important Links / Resources')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Resource Link</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddSection('key_value', 'Key Details')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted text-foreground border border-border text-xs font-semibold hover:bg-muted/80 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Key/Value</span>
              </button>
            </div>
          </div>

          {/* Sections List */}
          {customSections.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed rounded-2xl bg-muted/20 text-muted-foreground text-xs">
              No custom sections added yet. Click one of the buttons above to add an editable section with your own title and content.
            </div>
          ) : (
            <div className="space-y-4">
              {customSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="p-5 rounded-2xl border border-border/80 bg-background/60 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 max-w-sm">
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Section Title / Heading <span className="text-muted-foreground/60 font-normal">(Renameable)</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Overview, Prerequisites, Schedule, Prizes"
                        value={sec.title}
                        onChange={(e) => handleUpdateSection(idx, { title: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-google-green"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Datatype Selector */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-0.5">
                          Type
                        </label>
                        <select
                          value={sec.type || 'markdown'}
                          onChange={(e) =>
                            handleUpdateSection(idx, {
                              type: e.target.value as EventFieldType,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none"
                        >
                          <option value="markdown">Markdown Text</option>
                          <option value="text">Plain Text</option>
                          <option value="key_value">Key / Value</option>
                          <option value="link">Resource Link</option>
                          <option value="list">Bullet List</option>
                        </select>
                      </div>

                      {/* Delete Section Button (Any section can be deleted) */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-3.5"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Section Content Area */}
                  {sec.type === 'link' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Link URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={sec.url || ''}
                          onChange={(e) => handleUpdateSection(idx, { url: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Description / Note
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Join the Discord Channel"
                          value={sec.content}
                          onChange={(e) => handleUpdateSection(idx, { content: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-muted-foreground">
                          {sec.type === 'markdown'
                            ? 'Markdown Content (supports **bold**, lists, headers, links)'
                            : 'Content'}
                        </label>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Write content, details, requirements or formatted markdown..."
                        value={sec.content}
                        onChange={(e) => handleUpdateSection(idx, { content: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-input bg-card text-sm text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-google-green resize-y leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Live Rendered Markdown Preview inside the field */}
                  {sec.type === 'markdown' && sec.content.trim() && (
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs">
                      <p className="text-[10px] font-mono uppercase font-bold text-muted-foreground mb-1">
                        Rendered Markdown Preview:
                      </p>
                      <MarkdownRenderer content={sec.content} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Form Expiration & Registration Questions Card */}
        <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-lg font-bold font-sans flex items-center gap-2">
                <FileText className="w-5 h-5 text-google-yellow" />
                <span>Registration Form & Deadline</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set registration expiry and customize questions. You can delete any question.
              </p>
            </div>
          </div>

          {/* Form Expiration Date & Time Picker */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-foreground">
                Registration Deadline (`expires_at`)
              </label>
              <span className="text-[11px] font-mono text-muted-foreground">
                Submissions rejected automatically after this time
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="relative flex items-center">
                <input
                  ref={expiryInputRef}
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-yellow/30 focus:border-google-yellow"
                />
                <button
                  type="button"
                  onClick={() => expiryInputRef.current?.showPicker?.()}
                  className="absolute left-3 p-0.5 text-google-yellow hover:scale-110 transition-transform"
                  title="Open Calendar Date Picker"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyExpiryPreset('start')}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
                >
                  At Event Start
                </button>
                <button
                  type="button"
                  onClick={() => applyExpiryPreset('1day')}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
                >
                  1 Day Before
                </button>
                <button
                  type="button"
                  onClick={() => applyExpiryPreset('2hours')}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
                >
                  2 Hours Before
                </button>
              </div>
            </div>
          </div>

          {/* Google Sheets Auto-Sync (Optional) */}
          <div className="p-5 rounded-2xl bg-google-green/5 border border-google-green/20 space-y-3">
            <div className="flex items-start gap-3">
              <TableProperties className="w-5 h-5 text-google-green shrink-0 mt-0.5" />
              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground mb-0.5">
                  Google Sheets Link for Auto-Logging (Optional)
                </label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Paste the shareable URL of a Google Sheet. Every new submission will be auto-appended as a row (requires backend Google Sheets API integration). You can export CSV from the Submissions page as an alternative.
                </p>
                <div className="relative">
                  <TableProperties className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-google-green/60" />
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-google-green/30 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-green/30 focus:border-google-green"
                  />
                </div>
                {sheetsUrl && (
                  <a
                    href={sheetsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-google-green hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview Linked Sheet</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Form Questions List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-sans">Registration Form Questions</h3>
              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-google-blue text-white text-xs font-semibold hover:bg-google-blue/90 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {formFields.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed rounded-2xl bg-muted/20 text-muted-foreground text-xs">
                No custom questions. Students will register with their account name and email.
              </div>
            ) : (
              <div className="space-y-3">
                {formFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl border border-border/80 bg-background/70 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        Question #{idx + 1}
                      </span>
                      {/* Allow deleting any question */}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Question Label
                        </label>
                        <input
                          type="text"
                          required
                          value={field.label}
                          onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            handleUpdateField(idx, {
                              type: e.target.value as FormField['type'],
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Paragraph</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="select">Dropdown Select</option>
                          <option value="checkbox">Checkbox (Yes/No)</option>
                        </select>
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="Option A, Option B, Option C"
                          value={(field.options || []).join(', ')}
                          onChange={(e) =>
                            handleUpdateField(idx, {
                              options: e.target.value
                                .split(',')
                                .map((o) => o.trim())
                                .filter(Boolean),
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="checkbox"
                        id={`req_${field.id}`}
                        checked={field.required || false}
                        onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                        className="rounded border-input text-google-blue focus:ring-google-blue"
                      />
                      <label
                        htmlFor={`req_${field.id}`}
                        className="text-xs text-foreground/80 font-medium cursor-pointer"
                      >
                        Required Question
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar with Live Preview */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-border">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-5 py-3 rounded-2xl border border-google-blue/30 bg-google-blue/10 text-google-blue hover:bg-google-blue/20 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Live Student Preview</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-google-green hover:bg-google-green/90 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing && isPublished ? 'Save Live Changes' : 'Publish Event'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Modal (Shows exact student view) */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              data-lenis-prevent
              className="w-full max-w-3xl rounded-3xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-google-green animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase text-foreground">
                    Live Student View Preview
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Content */}
              <div data-lenis-prevent className="max-h-[75vh] overflow-y-auto p-6 sm:p-8 space-y-6">
                {/* Banner */}
                {bannerUrl && (
                  <div className="relative h-48 sm:h-64 w-full rounded-2xl overflow-hidden bg-black">
                    <img
                      src={bannerUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                )}

                {/* Title & Badge */}
                <div className="space-y-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase inline-block"
                    style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                  >
                    {category || 'Workshop'}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold font-sans">
                    {title || 'Untitled Event'}
                  </h2>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs">
                  <div>
                    <span className="font-mono text-muted-foreground uppercase font-bold">Date</span>
                    <p className="font-semibold text-sm mt-0.5">{formatEventDate(startTime)}</p>
                  </div>
                  <div>
                    <span className="font-mono text-muted-foreground uppercase font-bold">Time</span>
                    <p className="font-semibold text-sm mt-0.5">{formatEventTimeRange(startTime, endTime)}</p>
                  </div>
                  <div>
                    <span className="font-mono text-muted-foreground uppercase font-bold">Venue</span>
                    <p className="font-semibold text-sm mt-0.5 truncate">{location || 'Campus'}</p>
                  </div>
                </div>

                {/* Custom Sections Rendered with Markdown */}
                {customSections.map((sec) => (
                  <div key={sec.id} className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                    <h3 className="text-base font-bold font-sans text-foreground">{sec.title}</h3>
                    {sec.type === 'link' ? (
                      <a
                        href={sec.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-google-blue hover:underline inline-flex items-center gap-1"
                      >
                        <span>{sec.content || sec.url || 'Open Resource'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <MarkdownRenderer content={sec.content} />
                    )}
                  </div>
                ))}

                {/* Registration CTA Preview */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl border text-xs font-semibold text-foreground bg-background"
                  >
                    + Add to Google Calendar
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-xl bg-google-blue text-white text-xs font-bold shadow-md"
                  >
                    Register / Fill Form ({formFields.length} questions)
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminEventEditorPage;
