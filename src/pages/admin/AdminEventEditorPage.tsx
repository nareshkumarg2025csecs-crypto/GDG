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
  Loader2,
  Mail,
  Send,
  Copy,
  QrCode,
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
  DEFAULT_FORM_FIELDS,
  formatEventDate,
  formatEventTimeRange,
} from '@/lib/formUtils';
import { DEPARTMENT_OPTIONS, YEAR_OF_STUDY_OPTIONS } from '@/lib/profileConstants';
import {
  DEFAULT_EMAIL_HTML_DRAFT,
  DEFAULT_QR_PAYLOAD_PRESET,
  QR_PAYLOAD_PRESETS,
} from '@/lib/emailTemplates';

export interface EmailDraftConfig {
  mode: 'default' | 'custom';
  subject: string;
  body: string;
  include_qr: boolean;
}

export interface QrCodeConfig {
  mode: 'default' | 'manual';
  content: string;
}

/**
 * Safely converts an ISO datetime string to browser local YYYY-MM-DDTHH:mm format
 * for datetime-local inputs without timezone distortion.
 */
export const isoToLocalInput = (isoStr?: string | null): string => {
  if (!isoStr) return '';
  if (typeof isoStr === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(isoStr)) {
    return isoStr;
  }
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) {
    return typeof isoStr === 'string' ? isoStr.replace(/Z$/i, '').slice(0, 16) : '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const GOOGLE_THEME_COLORS = [
  { name: 'Google Blue', hex: '#4285F4' },
  { name: 'Google Red', hex: '#EA4335' },
  { name: 'Google Yellow', hex: '#FBBC04' },
  { name: 'Google Green', hex: '#34A853' },
  { name: 'Purple Neon', hex: '#A142F4' },
];

/**
 * Interactive Dropdown Options Editor
 * Allows typing commas naturally without character loss, plus pill tag removal.
 */
function SelectOptionsEditor({
  options = [],
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  const [textValue, setTextValue] = useState((options || []).join(', '));

  useEffect(() => {
    setTextValue((options || []).join(', '));
  }, [options.join(',')]);

  const handleTextChange = (val: string) => {
    setTextValue(val);
    const parsed = val
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    onChange(parsed);
  };

  const handleRemoveOption = (index: number) => {
    const next = options.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold text-muted-foreground">
        Dropdown Options (comma-separated or use pills below)
      </label>

      {/* Option Tags Preview */}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-0.5">
          {options.map((opt, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-google-blue/10 text-google-blue border border-google-blue/20"
            >
              <span>{opt}</span>
              <button
                type="button"
                onClick={() => handleRemoveOption(i)}
                className="hover:text-destructive text-google-blue/70 transition-colors font-bold text-xs"
                title="Remove option"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Option A, Option B, Option C"
        value={textValue}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={() => {
          const cleaned = textValue
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean);
          onChange(cleaned);
          setTextValue(cleaned.join(', '));
        }}
        className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
      />

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] text-muted-foreground font-mono">Presets:</span>
        <button
          type="button"
          onClick={() => {
            onChange([...DEPARTMENT_OPTIONS]);
            setTextValue(DEPARTMENT_OPTIONS.join(', '));
          }}
          className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          Standard Departments ({DEPARTMENT_OPTIONS.length})
        </button>
        <button
          type="button"
          onClick={() => {
            onChange([...YEAR_OF_STUDY_OPTIONS]);
            setTextValue(YEAR_OF_STUDY_OPTIONS.join(', '));
          }}
          className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          Study Years (1st - 4th)
        </button>
      </div>
    </div>
  );
}

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
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState(''); // Optional Google Sheets URL for auto-logging submissions
  const [formFields, setFormFields] = useState<FormField[]>(DEFAULT_FORM_FIELDS);

  // Email Notification & Draft Configuration State
  const [emailConfig, setEmailConfig] = useState<EmailDraftConfig>({
    mode: 'default',
    subject: 'Registration Confirmed: {{event_title}} (Ticket {{ticket_id}})',
    body: DEFAULT_EMAIL_HTML_DRAFT,
    include_qr: true,
  });
  const [emailViewMode, setEmailViewMode] = useState<'visual' | 'code'>('code');
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);

  // Check-in QR Code Scanned Payload Configuration State
  const [qrConfig, setQrConfig] = useState<QrCodeConfig>({
    mode: 'default',
    content: DEFAULT_QR_PAYLOAD_PRESET,
  });

  // Helper to construct visual HTML for email preview with identical design and in-body QR placement as default pass
  const buildVisualEmailHtml = (rawBody: string, includeQr: boolean) => {
    let content = rawBody || '';

    // Interpolate standard attendee & event placeholders
    content = content
      .replace(/\{\{\s*name\s*\}\}/gi, 'Alex Johnson')
      .replace(/\{\{\s*email\s*\}\}/gi, 'alex.johnson@campus.edu')
      .replace(/\{\{\s*event_title\s*\}\}/gi, title || 'GDG Tech Summit 2026')
      .replace(/\{\{\s*ticket_id\s*\}\}/gi, 'TKT-GDG8492')
      .replace(/\{\{\s*venue\s*\}\}/gi, location || 'Main Campus Auditorium')
      .replace(/\{\{\s*date\s*\}\}/gi, startTime ? formatEventDate(startTime) : 'Saturday, Oct 14, 2026')
      .replace(/\{\{\s*time\s*\}\}/gi, startTime ? formatEventTimeRange(startTime, endTime) : '10:00 AM - 1:00 PM')
      .replace(/\{\{\s*ticket_link\s*\}\}/gi, 'http://localhost:8081/events/register?ticket=TKT-GDG8492');

    const rawQrTemplate =
      qrConfig.mode === 'manual' && qrConfig.content && qrConfig.content.trim()
        ? qrConfig.content
        : DEFAULT_QR_PAYLOAD_PRESET;

    const populatedQrContent = rawQrTemplate
      .replace(/\{\{\s*ticket_id\s*\}\}/gi, 'TKT-GDG8492')
      .replace(/\{\{\s*name\s*\}\}/gi, 'Alex Johnson')
      .replace(/\{\{\s*email\s*\}\}/gi, 'alex.johnson@campus.edu')
      .replace(/\{\{\s*event_title\s*\}\}/gi, title || 'GDG Tech Summit 2026')
      .replace(/\{\{\s*venue\s*\}\}/gi, location || 'Main Campus Auditorium')
      .replace(/\{\{\s*date\s*\}\}/gi, startTime ? formatEventDate(startTime) : 'Saturday, Oct 14, 2026')
      .replace(/\{\{\s*time\s*\}\}/gi, startTime ? formatEventTimeRange(startTime, endTime) : '10:00 AM - 1:00 PM')
      .replace(/\{\{\s*ticket_link\s*\}\}/gi, 'http://localhost:8081/events/register?ticket=TKT-GDG8492');

    const qrPayload = encodeURIComponent(populatedQrContent);

    // EXACT same official dark gradient pass card design as default email
    const qrCardMarkup = `
    <!-- Digital Pass QR Card -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 24px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
        Official Digital Event Pass
      </div>
      <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; font-family: monospace; color: #38bdf8; margin-bottom: 14px;">
        TKT-GDG8492
      </div>
      <div style="background-color: #ffffff; padding: 12px; border-radius: 14px; display: inline-block; margin-bottom: 12px;">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&amp;format=png&amp;margin=4&amp;data=${qrPayload}"
          alt="Ticket QR - TKT-GDG8492"
          width="150"
          height="150"
          style="display: block; border-radius: 8px; margin: 0 auto;"
        />
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
        📱 Present this QR pass at the venue entrance desk for verification.
      </div>
    </div>
    <!-- /Digital Pass QR Card -->`;

    // 1. If explicit {{qr_code}} placeholder is present, replace it in place
    if (/\{\{\s*qr_code\s*\}\}/i.test(content)) {
      return content.replace(/\{\{\s*qr_code\s*\}\}/gi, includeQr ? qrCardMarkup : '');
    }

    // 2. If QR is disabled, strip any existing QR card from template markup
    if (!includeQr) {
      return content
        .replace(/<!-- Digital Pass QR Card -->[\s\S]*?<!-- \/Digital Pass QR Card -->/gi, '')
        .replace(/<div[^>]*style="[^"]*linear-gradient\(145deg,\s*#0f172a,\s*#1e293b\)[\s\S]*?<\/div>\s*<\/div>/gi, '');
    }

    // 3. If QR is enabled and already has the digital pass card, update its payload with all details and return without injecting another
    if (
      content.includes('<!-- Digital Pass QR Card -->') ||
      content.includes('Official Digital Event Pass') ||
      content.includes('cid:ticket-qr-code') ||
      content.includes('create-qr-code')
    ) {
      let updated = content;
      if (updated.includes('cid:ticket-qr-code')) {
        updated = updated.replace(/cid:ticket-qr-code/g, `https://api.qrserver.com/v1/create-qr-code/?size=160x160&amp;format=png&amp;margin=4&amp;data=${qrPayload}`);
      }
      if (/https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/[^\s"']+/i.test(updated)) {
        updated = updated.replace(
          /https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/[^\s"']+/gi,
          `https://api.qrserver.com/v1/create-qr-code/?size=160x160&amp;format=png&amp;margin=4&amp;data=${qrPayload}`
        );
      }
      return updated;
    }

    // 4. Place QR in the same place as default email: inside the card, before Important Notice, CTA button, or footer
    if (content.includes('<!-- Important Notice')) {
      return content.replace('<!-- Important Notice', `${qrCardMarkup}\n\n    <!-- Important Notice`);
    }
    if (content.includes('<!-- Call to Action')) {
      return content.replace('<!-- Call to Action', `${qrCardMarkup}\n\n    <!-- Call to Action`);
    }
    if (content.includes('<!-- Footer')) {
      return content.replace('<!-- Footer', `${qrCardMarkup}\n\n  <!-- Footer`);
    }
    if (content.includes('</div>\n  </div>')) {
      return content.replace('</div>\n  </div>', `${qrCardMarkup}\n  </div>\n  </div>`);
    }
    if (content.includes('</body>')) {
      return content.replace('</body>', `${qrCardMarkup}\n</body>`);
    }

    return `${content}\n${qrCardMarkup}`;
  };

  // Live Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Loading & Submitting
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingMode, setSavingMode] = useState<'draft' | 'publish' | null>(null);
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
    if (showPreviewModal || showEmailPreviewModal) {
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
  }, [showPreviewModal, showEmailPreviewModal]);


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

      const pad = (n: number) => String(n).padStart(2, '0');
      const startIsoStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`;
      const endIsoStr = `${endTomorrow.getFullYear()}-${pad(endTomorrow.getMonth() + 1)}-${pad(endTomorrow.getDate())}T12:30`;

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
          setStartTime(isoToLocalInput(details.startTime || details.start_time));
        }

        if (details.endTime || details.end_time) {
          setEndTime(isoToLocalInput(details.endTime || details.end_time));
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
              setExpiresAt(isoToLocalInput(form.expires_at || form.schema?.expires_at));
            }

            if (form.schema?.fields && Array.isArray(form.schema.fields)) {
              setFormFields(form.schema.fields);
            }

            if (form.schema?.is_open !== undefined) {
              setIsRegistrationOpen(form.schema.is_open);
            } else if (details.is_registration_open !== undefined) {
              setIsRegistrationOpen(details.is_registration_open);
            }

            // Load existing Sheets URL if previously saved
            if (form.schema?.sheets_url) {
              setSheetsUrl(form.schema.sheets_url);
            }

            // Load existing Email Draft configuration
            if (form.schema?.email_config) {
              const cfg = form.schema.email_config;
              setEmailConfig({
                mode: cfg.mode === 'custom' ? 'custom' : 'default',
                subject: cfg.subject || 'Registration Confirmed: {{event_title}} (Ticket {{ticket_id}})',
                body: cfg.body || cfg.html || DEFAULT_EMAIL_HTML_DRAFT,
                include_qr: cfg.include_qr !== false,
              });
            }

            // Load existing QR Code Scanned Payload configuration
            if (form.schema?.qr_config) {
              const qcfg = form.schema.qr_config;
              setQrConfig({
                mode: qcfg.mode === 'manual' ? 'manual' : 'default',
                content: qcfg.content || DEFAULT_QR_PAYLOAD_PRESET,
              });
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

  // Expiration presets with zero timezone distortion
  const applyExpiryPreset = (preset: 'start' | '1day' | '2hours') => {
    if (!startTime) {
      toast({
        title: 'Set Event Start Time First',
        description: 'Please pick an Event Start Date & Time above before setting registration deadline presets.',
        variant: 'destructive',
      });
      return;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const [datePart, timePart = '00:00'] = startTime.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);

    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      toast({
        title: 'Invalid Start Time',
        description: 'Please specify a valid start date and time.',
        variant: 'destructive',
      });
      return;
    }

    if (preset === 'start') {
      // Exactly at event start: identical date and time
      setExpiresAt(startTime);
      toast({
        title: 'Deadline Set: At Event Start',
        description: `Registration will close at event start (${datePart} ${timePart}).`,
      });
    } else if (preset === '1day') {
      // Exactly 1 day (24 hours) prior
      const target = new Date(y, m - 1, d, hh, mm);
      target.setDate(target.getDate() - 1);
      const formatted = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
      setExpiresAt(formatted);
      const [newD, newT] = formatted.split('T');
      toast({
        title: 'Deadline Set: 1 Day Before Start',
        description: `Registration will close 1 day before event (${newD} ${newT}).`,
      });
    } else if (preset === '2hours') {
      // Exactly 2 hours prior
      const target = new Date(y, m - 1, d, hh, mm);
      target.setHours(target.getHours() - 2);
      const formatted = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
      setExpiresAt(formatted);
      const [newD, newT] = formatted.split('T');
      toast({
        title: 'Deadline Set: 2 Hours Before Start',
        description: `Registration will close 2 hours before event (${newD} ${newT}).`,
      });
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

    const targetPublished =
      forcePublish !== undefined ? forcePublish : isEditing ? isPublished : true;

    setSavingMode(targetPublished ? 'publish' : 'draft');
    setIsSubmitting(true);

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
        is_registration_open: isRegistrationOpen,
        startTime: startTime,
        start_time: startTime,
        endTime: endTime || startTime,
        end_time: endTime || startTime,
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
        const formSchema: FormSchema & {
          sheets_url?: string;
          is_open?: boolean;
          email_config?: EmailDraftConfig;
          qr_config?: QrCodeConfig;
        } = {
          fields: formFields,
          is_open: isRegistrationOpen,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          email_config: emailConfig,
          qr_config: qrConfig,
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
      } else if (!hasForm && existingFormId) {
        try {
          await formService.deleteForm(existingFormId);
        } catch {
          // ignore
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
      setSavingMode(null);
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
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting && savingMode === 'draft' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <span>Save as Draft</span>
              )}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="px-4 py-2 rounded-xl bg-google-green hover:bg-google-green/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting && savingMode === 'publish' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isEditing && isPublished ? 'Saving Changes...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing && isPublished ? 'Save Live Changes' : 'Publish Event'}</span>
                </>
              )}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold font-sans flex items-center gap-2">
                <FileText className="w-5 h-5 text-google-yellow" />
                <span>Registration Form</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Include an interactive registration form with custom questions or keep this event informational.
              </p>
            </div>

            {/* Clear Yes/No Form Toggle */}
            <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setHasForm(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  hasForm
                    ? 'bg-google-blue text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yes (Include Form)
              </button>
              <button
                type="button"
                onClick={() => setHasForm(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !hasForm
                    ? 'bg-muted-foreground/20 text-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                No (Informational Only)
              </button>
            </div>
          </div>

          {!hasForm ? (
            <div className="p-6 rounded-2xl bg-muted/20 border border-dashed border-border text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No Registration Form Attached</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Students can view full event details, add it to their Google Calendar, and share it via link or QR code, without filling out a form.
              </p>
            </div>
          ) : (
            <>
          {/* Registration Status: Manual Open/Closed Toggle */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isRegistrationOpen ? 'bg-google-green animate-pulse' : 'bg-destructive'
                  }`}
                />
                <span className="text-xs font-bold uppercase font-mono text-foreground">
                  Registration Status: {isRegistrationOpen ? 'OPEN' : 'CLOSED (Manual Override)'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isRegistrationOpen
                  ? 'Students can register until the deadline expires. Click toggle to close immediately.'
                  : 'Registrations are closed. Students see "Registration Closed" and cannot submit.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRegistrationOpen(!isRegistrationOpen)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
                isRegistrationOpen
                  ? 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20'
                  : 'bg-google-green text-white shadow-google-green/20 hover:bg-google-green/90'
              }`}
            >
              {isRegistrationOpen ? 'Close Registrations' : 'Open Registrations'}
            </button>
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
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
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          localStorage.setItem('auth_link_redirect', window.location.pathname);
                          const { url } = await eventService.getGoogleLinkUrl();
                          if (url) window.location.href = url;
                        } catch (err: any) {
                          toast({ title: 'Error', description: err.message || 'Could not initiate Google connection.', variant: 'destructive' });
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-google-green/10 border border-google-green/30 text-google-green text-xs font-semibold hover:bg-google-green/20 transition-all shrink-0"
                      title="Grant Google Sheets write token (login session remains unchanged)"
                    >
                      <TableProperties className="w-3.5 h-3.5" />
                      <span>Authorize Google Account</span>
                    </button>
                  )}
                </div>
                {sheetsUrl && (
                  <div className="flex items-center gap-3 mt-2">
                    <a
                      href={sheetsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-google-green hover:underline font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview Linked Sheet</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Questions List */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
              <div>
                <h3 className="text-sm font-bold font-sans flex items-center gap-2">
                  <span>Registration Form Questions</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-google-blue/10 text-google-blue border border-google-blue/20">
                    {formFields.length} {formFields.length === 1 ? 'Question' : 'Questions'}
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Standard defaults: Full Name, Email, Phone Number, Department, and Year of Study.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormFields(DEFAULT_FORM_FIELDS);
                    toast({
                      title: 'Standard Questions Loaded',
                      description: 'Reset to standard defaults: Name, Email, Phone, Department, and Year of Study.',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-google-yellow/40 bg-google-yellow/10 text-google-yellow hover:bg-google-yellow/20 text-xs font-semibold transition-all shadow-sm"
                  title="Reset to 5 standard dashboard questions (Name, Email, Phone, Department, Year)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Default 5 Questions</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddField}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-google-blue text-white text-xs font-semibold hover:bg-google-blue/90 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Quick-Add Presets Bar */}
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/40 border border-border/70 text-xs">
              <span className="text-[11px] font-mono text-muted-foreground mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => {
                  const exists = formFields.some(f => f.name === 'phone_number');
                  if (exists) {
                    toast({ title: 'Already added', description: 'Phone number is already in the form.' });
                    return;
                  }
                  const phoneField = DEFAULT_FORM_FIELDS.find(f => f.name === 'phone_number');
                  if (phoneField) setFormFields(prev => [...prev, { ...phoneField, id: `f_${Date.now()}` }]);
                }}
                className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
              >
                + Phone Number
              </button>

              <button
                type="button"
                onClick={() => {
                  const exists = formFields.some(f => f.name === 'department');
                  if (exists) {
                    toast({ title: 'Already added', description: 'Department is already in the form.' });
                    return;
                  }
                  const deptField = DEFAULT_FORM_FIELDS.find(f => f.name === 'department');
                  if (deptField) setFormFields(prev => [...prev, { ...deptField, id: `f_${Date.now()}` }]);
                }}
                className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
              >
                + Department (14 Standard Depts)
              </button>

              <button
                type="button"
                onClick={() => {
                  const exists = formFields.some(f => f.name === 'year_of_study');
                  if (exists) {
                    toast({ title: 'Already added', description: 'Year of study is already in the form.' });
                    return;
                  }
                  const yearField = DEFAULT_FORM_FIELDS.find(f => f.name === 'year_of_study');
                  if (yearField) setFormFields(prev => [...prev, { ...yearField, id: `f_${Date.now()}` }]);
                }}
                className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
              >
                + Year of Study (1st - 4th Year)
              </button>
            </div>

            {formFields.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed rounded-2xl bg-muted/20 text-muted-foreground text-xs">
                No questions configured. Click "Load Default 5 Questions" to add standard registration fields.
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
                      <SelectOptionsEditor
                        options={field.options || []}
                        onChange={(opts) => handleUpdateField(idx, { options: opts })}
                      />
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
          </>
          )}
        </div>

        {/* 4. Automated Registration Email Notification & Custom Draft Builder Card */}
        {hasForm && (
          <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-4 gap-3">
              <div>
                <h2 className="text-lg font-bold font-sans flex items-center gap-2">
                  <Mail className="w-5 h-5 text-google-blue" />
                  <span>Registration Confirmation Email</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure the automated confirmation email dispatched to attendees upon completing this form.
                </p>
              </div>

              {/* Default vs Custom Toggle */}
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setEmailConfig((prev) => ({ ...prev, mode: 'default' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    emailConfig.mode === 'default'
                      ? 'bg-google-blue text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Default QR Pass
                </button>
                <button
                  type="button"
                  onClick={() => setEmailConfig((prev) => ({ ...prev, mode: 'custom' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    emailConfig.mode === 'custom'
                      ? 'bg-google-blue text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Custom Email Draft
                </button>
              </div>
            </div>

            {emailConfig.mode === 'default' ? (
              /* Default Branded Pass Card */
              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-google-blue/10 border border-google-blue/20 flex items-center justify-center text-google-blue shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Standard GDG Digital Pass Email
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every registered student receives an official branded confirmation with their sequential Ticket ID, event schedule, campus venue, calendar synchronization links, and an inline scannable QR pass for fast desk check-in.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmailPreviewModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-google-blue" />
                    <span>Preview Default Email Structure</span>
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    Zero setup required &bull; 100% responsive layout with QR code
                  </span>
                </div>
              </div>
            ) : (
              /* Custom Email Draft Editor */
              <div className="space-y-4">
                {/* Subject Line */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailConfig.subject}
                    onChange={(e) => setEmailConfig((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Registration Confirmed: {{event_title}} (Ticket {{ticket_id}})"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue font-sans shadow-sm"
                  />
                </div>

                {/* Variable helper tags chips */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      Dynamic Placeholders (Click to insert):
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Automatically populated for each registrant
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{{name}}', label: 'Attendee Name' },
                      { tag: '{{event_title}}', label: 'Event Title' },
                      { tag: '{{ticket_id}}', label: 'Ticket ID' },
                      { tag: '{{qr_code}}', label: 'Digital Pass QR Card' },
                      { tag: '{{date}}', label: 'Event Date' },
                      { tag: '{{time}}', label: 'Event Time' },
                      { tag: '{{venue}}', label: 'Venue' },
                      { tag: '{{ticket_link}}', label: 'Digital Pass URL' },
                    ].map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setEmailConfig((prev) => ({
                            ...prev,
                            body: prev.body + ' ' + tag,
                          }));
                          toast({ title: 'Tag Inserted', description: `Added ${tag} to draft.` });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border text-[11px] font-mono font-medium text-foreground transition-all shadow-xs"
                      >
                        <span className="text-google-blue font-bold">{tag}</span>
                        <span className="text-[10px] text-muted-foreground">({label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Draft Content Editor with HTML Code / Visual Preview Toggle */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-foreground">
                      Email Body Content (Raw HTML Code Supported)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEmailConfig((prev) => ({
                            ...prev,
                            body: DEFAULT_EMAIL_HTML_DRAFT,
                          }));
                          toast({
                            title: 'Default Structure Loaded',
                            description: 'Loaded standard GDG confirmation pass HTML template.',
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-google-blue transition-colors"
                      >
                        Reset to Default HTML Pass
                      </button>

                      <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border text-[11px]">
                        <button
                          type="button"
                          onClick={() => setEmailViewMode('code')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                            emailViewMode === 'code'
                              ? 'bg-card text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          &lt;/&gt; HTML Code
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailViewMode('visual')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                            emailViewMode === 'visual'
                              ? 'bg-card text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          👁️ Live Output
                        </button>
                      </div>
                    </div>
                  </div>

                  {emailViewMode === 'code' ? (
                    <textarea
                      rows={12}
                      value={emailConfig.body}
                      onChange={(e) => setEmailConfig((prev) => ({ ...prev, body: e.target.value }))}
                      placeholder="Write your custom HTML email draft here..."
                      className="w-full p-3.5 rounded-xl border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue font-mono leading-relaxed shadow-sm"
                    />
                  ) : (
                    <div className="p-4 sm:p-5 rounded-2xl border border-border bg-white text-slate-900 shadow-sm max-h-[550px] overflow-y-auto">
                      <div
                        className="text-xs leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: buildVisualEmailHtml(emailConfig.body, emailConfig.include_qr),
                        }}
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Accepts pure HTML tags (<code>&lt;div&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;table&gt;</code>, inline styles, etc.) or standard formatted text with line breaks.
                  </p>
                </div>

                {/* Include QR Pass Toggle & Preview Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailConfig.include_qr}
                      onChange={(e) => setEmailConfig((prev) => ({ ...prev, include_qr: e.target.checked }))}
                      className="rounded border-input text-google-blue focus:ring-google-blue w-4 h-4"
                    />
                    <span className="text-xs font-medium text-foreground select-none">
                      Include Official Digital Pass QR Card in email
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowEmailPreviewModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-google-blue/40 bg-google-blue/10 text-google-blue hover:bg-google-blue/20 transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Custom Email</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Check-in QR Code Scanned Payload Configuration Card */}
        {hasForm && (
          <div className="p-6 sm:p-8 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-4 gap-3">
              <div>
                <h2 className="text-lg font-bold font-sans flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-google-green" />
                  <span>Check-in QR Code Content</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure what phone cameras or barcode scanners read when scanning this attendee's entry QR pass.
                </p>
              </div>

              {/* Default vs Manual Toggle */}
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setQrConfig((prev) => ({ ...prev, mode: 'default' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    qrConfig.mode === 'default'
                      ? 'bg-google-green text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Default (Full Ticket Info)
                </button>
                <button
                  type="button"
                  onClick={() => setQrConfig((prev) => ({ ...prev, mode: 'manual' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    qrConfig.mode === 'manual'
                      ? 'bg-google-green text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Manual / Custom Content
                </button>
              </div>
            </div>

            {qrConfig.mode === 'default' ? (
              /* Default Structured Pass Info */
              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-google-green/10 border border-google-green/20 flex items-center justify-center text-google-green shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Comprehensive Ticket Data Payload
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Scanning this QR code at check-in outputs the structured ticket details including Event Title, Ticket ID, Attendee Full Name, Email, Custom Form Answers, Date, and Venue.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border/80 font-mono text-[11px] text-muted-foreground whitespace-pre leading-relaxed overflow-x-auto">
{`GDG EVENT TICKET
==============================
Event: ${title || 'GDG Event'}
Ticket ID: TKT-DEMO1234
Name: Alex Johnson
Email: alex.johnson@campus.edu
Date: ${startTime ? formatEventDate(startTime) : 'Saturday, Oct 14, 2026'}
Venue: ${location || 'Campus Main Auditorium'}
==============================
Google Developer Groups On Campus`}
                </div>
              </div>
            ) : (
              /* Manual QR Configuration */
              <div className="space-y-4">
                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                    Quick Preset Formats:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QR_PAYLOAD_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setQrConfig((prev) => ({ ...prev, content: preset.content }));
                          toast({ title: 'Preset Loaded', description: preset.name });
                        }}
                        className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variable helper tags */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">
                    Dynamic QR Variables (Click to append):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{{ticket_id}}', label: 'Ticket ID' },
                      { tag: '{{ticket_link}}', label: 'Check-in URL' },
                      { tag: '{{name}}', label: 'Attendee Name' },
                      { tag: '{{email}}', label: 'Email' },
                      { tag: '{{event_title}}', label: 'Event Title' },
                      { tag: '{{venue}}', label: 'Venue' },
                      { tag: '{{date}}', label: 'Date' },
                    ].map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setQrConfig((prev) => ({
                            ...prev,
                            content: prev.content ? `${prev.content} ${tag}` : tag,
                          }));
                          toast({ title: 'Tag Inserted', description: `Added ${tag} to QR payload.` });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border text-[11px] font-mono font-medium text-foreground transition-all shadow-xs"
                      >
                        <span className="text-google-green font-bold">{tag}</span>
                        <span className="text-[10px] text-muted-foreground">({label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scanned Output Editor and Live QR Scanner Preview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      QR Code Scanned Payload Content
                    </label>
                    <textarea
                      rows={6}
                      value={qrConfig.content}
                      onChange={(e) => setQrConfig((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="e.g. {{ticket_link}} or TICKET:{{ticket_id}}|USER:{{email}}"
                      className="w-full p-3.5 rounded-xl border border-input bg-card text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-green font-mono leading-relaxed shadow-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Whatever you type here is exactly what gets encoded into the QR code and read when scanned.
                    </p>
                  </div>

                  {/* Live Interactive QR Test on Screen */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                      Live Scanner Test
                    </span>
                    <div className="p-2.5 bg-white rounded-xl border border-border shadow-xs">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&format=png&margin=2&data=${encodeURIComponent(
                          (qrConfig.content || 'GDG-PASS')
                            .replace(/\{\{\s*ticket_id\s*\}\}/gi, 'TKT-DEMO1234')
                            .replace(/\{\{\s*name\s*\}\}/gi, 'Alex Johnson')
                            .replace(/\{\{\s*email\s*\}\}/gi, 'alex.johnson@campus.edu')
                            .replace(/\{\{\s*event_title\s*\}\}/gi, title || 'GDG Event')
                            .replace(/\{\{\s*venue\s*\}\}/gi, location || 'Auditorium')
                            .replace(/\{\{\s*date\s*\}\}/gi, startTime ? formatEventDate(startTime) : 'Oct 14, 2026')
                            .replace(/\{\{\s*ticket_link\s*\}\}/gi, 'http://localhost:8081/events/register?ticket=TKT-DEMO1234')
                        )}`}
                        alt="Scannable QR Test"
                        className="w-28 h-28 rounded-lg"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      📱 Point phone camera here to test
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


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
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting && savingMode === 'draft' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <span>Save as Draft</span>
              )}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-google-green hover:bg-google-green/90 text-white text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isSubmitting && savingMode === 'publish' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isEditing && isPublished ? 'Saving Live Changes...' : 'Publishing Event...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing && isPublished ? 'Save Live Changes' : 'Publish Event'}</span>
                </>
              )}
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

      {/* Live Email Draft Preview Modal */}
      <AnimatePresence>
        {showEmailPreviewModal && (
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
              className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-google-blue/10 border border-google-blue/20 flex items-center justify-center text-google-blue">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Email Draft Preview
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Simulated rendering for recipient: <span className="font-semibold text-foreground">alex.johnson@campus.edu</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailPreviewModal(false)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Subject Bar */}
              <div className="px-6 py-3 border-b border-border/60 bg-background/50 text-xs flex items-center gap-2">
                <span className="font-semibold text-muted-foreground uppercase font-mono text-[10px]">Subject:</span>
                <span className="font-medium text-foreground">
                  {emailConfig.mode === 'custom' && emailConfig.subject
                    ? emailConfig.subject
                        .replace(/\{\{\s*name\s*\}\}/gi, 'Alex Johnson')
                        .replace(/\{\{\s*event_title\s*\}\}/gi, title || 'GDG Tech Summit 2026')
                        .replace(/\{\{\s*ticket_id\s*\}\}/gi, 'TKT-GDG8492')
                        .replace(/\{\{\s*venue\s*\}\}/gi, location || 'Main Campus Auditorium')
                        .replace(/\{\{\s*date\s*\}\}/gi, startTime ? formatEventDate(startTime) : 'Saturday, Oct 14, 2026')
                        .replace(/\{\{\s*time\s*\}\}/gi, startTime ? formatEventTimeRange(startTime, endTime) : '10:00 AM - 1:00 PM')
                        .replace(/\{\{\s*ticket_link\s*\}\}/gi, 'http://localhost:8081/events/register?ticket=TKT-GDG8492')
                    : `Registration Confirmed: ${title || 'GDG Tech Summit 2026'} (Ticket TKT-GDG8492)`}
                </span>
              </div>

              {/* Email Content Container */}
              <div className="p-6 overflow-y-auto space-y-4 bg-muted/20 text-foreground font-sans max-h-[70vh]">
                {(() => {
                  const draftContent =
                    emailConfig.mode === 'default'
                      ? (DEFAULT_EMAIL_HTML_DRAFT || emailConfig.body)
                      : (emailConfig.body || '');

                  const hasHtmlMarkup = /<\/?[a-z][\s\S]*>/i.test(draftContent);

                  const replaceVariables = (str: string) =>
                    str
                      .replace(/\{\{\s*name\s*\}\}/gi, 'Alex Johnson')
                      .replace(/\{\{\s*email\s*\}\}/gi, 'alex.johnson@campus.edu')
                      .replace(/\{\{\s*event_title\s*\}\}/gi, title || 'GDG Tech Summit 2026')
                      .replace(/\{\{\s*ticket_id\s*\}\}/gi, 'TKT-GDG8492')
                      .replace(/\{\{\s*venue\s*\}\}/gi, location || 'Main Campus Auditorium')
                      .replace(/\{\{\s*date\s*\}\}/gi, startTime ? formatEventDate(startTime) : 'Saturday, Oct 14, 2026')
                      .replace(/\{\{\s*time\s*\}\}/gi, startTime ? formatEventTimeRange(startTime, endTime) : '10:00 AM - 1:00 PM')
                      .replace(/\{\{\s*ticket_link\s*\}\}/gi, 'http://localhost:8081/events/register?ticket=TKT-GDG8492');

                  const hasEmbeddedQr = /create-qr-code|ticket-qr-code|<img[^>]*qr/i.test(draftContent);
                  const rawQrTemplate =
                    qrConfig.mode === 'manual' && qrConfig.content && qrConfig.content.trim()
                      ? qrConfig.content
                      : DEFAULT_QR_PAYLOAD_PRESET;

                  const populatedQrContent = rawQrTemplate
                    .replace(/\{\{\s*ticket_id\s*\}\}/gi, 'TKT-GDG8492')
                    .replace(/\{\{\s*name\s*\}\}/gi, 'Alex Johnson')
                    .replace(/\{\{\s*email\s*\}\}/gi, 'alex.johnson@campus.edu')
                    .replace(/\{\{\s*event_title\s*\}\}/gi, title || 'GDG Tech Summit 2026')
                    .replace(/\{\{\s*venue\s*\}\}/gi, location || 'Main Campus Auditorium')
                    .replace(/\{\{\s*date\s*\}\}/gi, startTime ? formatEventDate(startTime) : 'Saturday, Oct 14, 2026')
                    .replace(/\{\{\s*time\s*\}\}/gi, startTime ? formatEventTimeRange(startTime, endTime) : '10:00 AM - 1:00 PM')
                    .replace(/\{\{\s*ticket_link\s*\}\}/gi, 'http://localhost:8081/events/register?ticket=TKT-GDG8492');

                  const qrPayloadData = encodeURIComponent(populatedQrContent);

                  if (hasHtmlMarkup) {
                    return (
                      <div className="max-w-xl mx-auto shadow-md rounded-2xl overflow-hidden bg-white text-slate-900 border border-border/80">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: buildVisualEmailHtml(
                              draftContent,
                              emailConfig.mode === 'default' || emailConfig.include_qr
                            ),
                          }}
                        />
                      </div>
                    );
                  }

                  // Plain text fallback preview
                  return (
                    <div className="max-w-xl mx-auto bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-5">
                      {/* GDG Top Header */}
                      <div className="flex items-center justify-between border-b border-border/60 pb-4">
                        <span className="text-base font-extrabold tracking-tight">
                          <span className="text-google-blue">G</span>
                          <span className="text-google-red">D</span>
                          <span className="text-google-yellow">G</span> On Campus
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border font-mono">
                          Registration Confirmed
                        </span>
                      </div>

                      {/* Plain Text Body Content */}
                      <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                        {replaceVariables(
                          draftContent ||
                            `Hi Alex Johnson,\n\nYour registration for ${title || 'GDG Tech Summit 2026'} has been confirmed! Below is your official digital pass.`
                        )}
                      </div>

                      {/* QR Pass Card (Same Official Design as Default Pass) */}
                      {(emailConfig.mode === 'default' || emailConfig.include_qr) && !hasEmbeddedQr && (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center space-y-3 shadow-lg border border-slate-700">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                            Official Digital Event Pass
                          </div>
                          <div className="text-xl font-bold font-mono tracking-widest text-sky-400">
                            TKT-GDG8492
                          </div>
                          <div className="inline-block p-3 rounded-xl bg-white border border-border shadow-xs">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&format=png&margin=4&data=${qrPayloadData}`}
                              alt="Ticket QR Demo"
                              className="w-36 h-36 mx-auto rounded-lg"
                            />
                          </div>
                          <div className="text-xs text-slate-300 space-y-0.5">
                            <p>
                              📅 {startTime ? formatEventDate(startTime) : 'Saturday, Oct 14, 2026'} &bull; ⏰{' '}
                              {startTime ? formatEventTimeRange(startTime, endTime) : '10:00 AM - 1:00 PM'}
                            </p>
                            <p>📍 {location || 'Main Campus Auditorium'}</p>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            📱 Present this QR pass at the venue entrance desk for verification.
                          </div>
                        </div>
                      )}

                      {/* Footer note */}
                      <div className="pt-4 border-t border-border/50 text-center text-[11px] text-muted-foreground">
                        Google Developer Groups On Campus &bull; Need help? Reply to this email.
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end px-6 py-3.5 border-t border-border bg-muted/30">
                <button
                  type="button"
                  onClick={() => setShowEmailPreviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminEventEditorPage;

