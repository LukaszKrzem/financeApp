import { useState, useMemo, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  IconSearch,
  IconCreditCard,
  IconTarget,
  IconCalendarEvent,
  IconShieldCheck,
  IconHelpCircle,
  IconSend,
  IconCheck,
  IconPaperclip,
  IconX,
  IconLoader2,
  IconPhoto,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';

const FAQ_ITEMS = [
  {
    id: 'bank-connections',
    category: 'Accounts & Banks',
    icon: IconCreditCard,
    question: 'How do I connect my bank account?',
    answer:
      'Navigate to the Accounts page and click "Connect bank". Select your financial institution from the supported list to authenticate safely via Open Banking protocols. Your credentials are never stored on our servers.',
  },
  {
    id: 'monthly-burn-rate',
    category: 'Subscriptions',
    icon: IconCalendarEvent,
    question: 'How is the monthly burn rate calculated?',
    answer:
      'The monthly burn rate sums all recurring expense transactions (such as subscriptions, rent, or utilities) normalized to a monthly frequency. Foreign currency amounts are automatically converted using current exchange rates.',
  },
  {
    id: 'budgets-alerts',
    category: 'Budgets & Goals',
    icon: IconTarget,
    question: 'How do spending limits and budgets work?',
    answer:
      'You can create category-specific budget limits on the Budgets page. As transactions are added or synced, SmartBudget tracks your spending progress against your set monthly limit.',
  },
  {
    id: 'security-privacy',
    category: 'Security & Privacy',
    icon: IconShieldCheck,
    question: 'Are my financial credentials safe?',
    answer:
      'Yes. SmartBudget uses read-only Open Banking connections through regulated providers. We never have access to your bank login details or the ability to execute transfers on your behalf.',
  },
  {
    id: 'savings-goals-progress',
    category: 'Budgets & Goals',
    icon: IconTarget,
    question: 'How do I track progress on savings goals?',
    answer:
      'Create a goal on the Savings Goals page with a target amount and date. Whenever you deposit money into savings, add a contribution to update your progress bar and remaining target.',
  },
  {
    id: 'currencies-exchange',
    category: 'Accounts & Banks',
    icon: IconCreditCard,
    question: 'Can I manage accounts in multiple currencies?',
    answer:
      'Yes. Accounts and transactions support multi-currency formatting. Values are converted dynamically to your base currency for aggregate totals on your Dashboard.',
  },
];

const TOPIC_CARDS = [
  {
    title: 'Accounts & Banks',
    description:
      'Learn how to link wallets and manage open banking connections.',
    icon: IconCreditCard,
    searchKeyword: 'Accounts',
  },
  {
    title: 'Budgets & Goals',
    description: 'Set monthly limits and track long-term savings objectives.',
    icon: IconTarget,
    searchKeyword: 'Budgets',
  },
  {
    title: 'Fixed Costs',
    description:
      'Track recurring subscriptions and calculate monthly burn rate.',
    icon: IconCalendarEvent,
    searchKeyword: 'Subscriptions',
  },
  {
    title: 'Security & Data',
    description: 'Understand read-only data access and encryption privacy.',
    icon: IconShieldCheck,
    searchKeyword: 'Security',
  },
];

export default function Help() {
  const { get, post } = useApi();
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [screenshot, setScreenshot] = useState(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return FAQ_ITEMS;

    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const processFile = (file) => {
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid image type', {
        description: 'Please upload a PNG, JPG, or WEBP image.',
      });
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      toast.error('File too large', {
        description: 'Image size must be smaller than 5MB.',
      });
      return;
    }

    setScreenshotFile(file);
    setScreenshotName(file.name || 'clipboard-screenshot.png');

    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshot(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          processFile(file);
          toast.info('Image attached from clipboard', {
            description: 'Screenshot added to your feedback submission.',
          });
          break;
        }
      }
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotName('');
    setScreenshotFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      let finalImageUrl = null;

      if (screenshotFile) {
        const mimeType = screenshotFile.type || 'image/png';

        // 1. Get presigned URL from backend
        const { upload_url, file_url } = await get(
          `/help/presigned-url?file_type=${encodeURIComponent(mimeType)}`
        );

        // 2. Upload file directly to S3
        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: screenshotFile,
          headers: {
            'Content-Type': mimeType,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image to S3 storage');
        }

        finalImageUrl = file_url;
      }

      // 3. Submit feedback to backend
      await post('/help/feedback', {
        message: feedback,
        screenshot: finalImageUrl,
      });

      setSubmitted(true);
      setFeedback('');
      handleRemoveScreenshot();

      toast.success('Thank you for your feedback!', {
        description:
          'We have received your message and will review it promptly.',
      });

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(
        error.message || 'An error occurred while submitting your feedback.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Help & Support"
        description="Find answers to common questions, user guides, and contact options."
      />

      <div className="bg-card border-border/50 border rounded-2xl p-6 md:p-8 flex flex-col items-center text-center gap-4">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <IconHelpCircle className="size-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
          How can we help you today?
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Search for help articles, FAQs, features, or bank integration steps
          below.
        </p>

        <div className="relative w-full max-w-lg mt-2">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            aria-label="Search questions"
            type="text"
            placeholder="Search questions (e.g. bank connection, budgets, currency)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-background"
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {TOPIC_CARDS.map((topic, index) => {
          const Icon = topic.icon;
          return (
            <Card
              key={index}
              className="border-border/50 transition-all hover:border-primary/50 cursor-pointer"
              onClick={() => setSearchQuery(topic.searchKeyword)}
            >
              <CardHeader className="flex flex-col gap-2 pb-4">
                <div className="flex flex-row items-center gap-3 space-y-0">
                  <div className="p-2 bg-muted rounded-lg text-foreground">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {topic.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {topic.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="bg-card border-border/50 border rounded-xl p-6 gap-4 flex flex-col">
        <h3 className="text-lg font-semibold tracking-tight">
          Frequently Asked Questions
        </h3>

        {filteredFaqs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">
              No questions found matching &quot;{searchQuery}&quot;.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left font-medium hover:no-underline text-base">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pl-1">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Need more help or have feedback?
          </CardTitle>
          <CardDescription>
            Send a message to our support team. You can attach or paste (Ctrl+V)
            a screenshot directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4">
            <Textarea
              aria-label="Describe your issue or suggestion"
              placeholder="Describe your issue or suggestion... (you can also paste screenshots directly from your clipboard)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onPaste={handlePaste}
              disabled={submitted || isSubmitting}
              rows={3}
              className="w-full min-h-[100px] resize-y bg-background"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileSelect}
              disabled={submitted || isSubmitting}
            />

            {screenshot && (
              <div className="flex items-center gap-3 p-2.5 border rounded-lg bg-muted/30 border-border/60 max-w-md">
                {screenshot.startsWith('data:image') ? (
                  <img
                    src={screenshot}
                    alt="Screenshot preview"
                    className="size-12 object-cover rounded-md border border-border"
                  />
                ) : (
                  <div className="size-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <IconPhoto className="size-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {screenshotName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Ready to upload to storage
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveScreenshot}
                  disabled={isSubmitting}
                  className="size-7 text-muted-foreground hover:text-destructive"
                  title="Remove screenshot"
                >
                  <IconX className="size-4" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitted || isSubmitting}
                className="shrink-0"
              >
                <IconPaperclip className="mr-2 size-4" />
                {screenshotFile ? 'Change Screenshot' : 'Attach Screenshot'}
              </Button>

              <Button
                type="submit"
                disabled={submitted || isSubmitting || !feedback.trim()}
                className="shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />{' '}
                    Uploading...
                  </>
                ) : submitted ? (
                  <>
                    <IconCheck className="mr-2 size-4" /> Sent
                  </>
                ) : (
                  <>
                    <IconSend className="mr-2 size-4" /> Send Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
