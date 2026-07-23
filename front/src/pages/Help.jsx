import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
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
} from '@tabler/icons-react';
import { toast } from 'sonner';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSubmitted(true);
    setFeedback('');

    toast.success('Thank you for your feedback!', {
      description: 'We have received your message and will review it promptly.',
    });

    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
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
            Send a message to our support team and we will get back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleFeedbackSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              aria-label="Describe your issue or suggestion"
              type="text"
              placeholder="Describe your issue or suggestion..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={submitted}
              className="flex-1"
            />
            <Button type="submit" disabled={submitted || !feedback.trim()}>
              {submitted ? (
                <>
                  <IconCheck className="mr-2 size-4" /> Sent
                </>
              ) : (
                <>
                  <IconSend className="mr-2 size-4" /> Send Feedback
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
