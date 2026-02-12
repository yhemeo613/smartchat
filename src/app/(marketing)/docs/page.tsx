'use client';

import { useI18n } from '@/lib/i18n';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  FileText,
  FileType,
  FileCode,
  FileEdit,
  ArrowRight,
  Check,
  X,
  Minus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DocsSidebar } from '@/components/marketing/docs/docs-sidebar';
import { DocsSection } from '@/components/marketing/docs/docs-section';
import { DocsCodeBlock } from '@/components/marketing/docs/docs-code-block';

const themeColors = [
  { name: 'Indigo', color: 'bg-indigo-500' },
  { name: 'Blue', color: 'bg-blue-500' },
  { name: 'Green', color: 'bg-green-500' },
  { name: 'Amber', color: 'bg-amber-500' },
  { name: 'Red', color: 'bg-red-500' },
  { name: 'Purple', color: 'bg-purple-500' },
  { name: 'Pink', color: 'bg-pink-500' },
  { name: 'Teal', color: 'bg-teal-500' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function DocsPage() {
  const { t } = useI18n();
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  const apiEndpoints = [
    { method: 'GET', path: '/api/bots', desc: t.docs.apiReference.endpoints.listBots },
    { method: 'POST', path: '/api/bots', desc: t.docs.apiReference.endpoints.createBot },
    { method: 'GET', path: '/api/bots/:id', desc: t.docs.apiReference.endpoints.getBot },
    { method: 'PUT', path: '/api/bots/:id', desc: t.docs.apiReference.endpoints.updateBot },
    { method: 'DELETE', path: '/api/bots/:id', desc: t.docs.apiReference.endpoints.deleteBot },
    { method: 'POST', path: '/api/chat/:botId', desc: t.docs.apiReference.endpoints.sendMessage },
    { method: 'GET', path: '/api/conversations/:botId', desc: t.docs.apiReference.endpoints.getConversations },
    { method: 'POST', path: '/api/documents/:botId', desc: t.docs.apiReference.endpoints.uploadDocument },
  ];

  const botConfigItems = [
    { key: 'name', label: t.docs.botManagement.name, desc: t.docs.botManagement.nameDesc },
    { key: 'desc', label: t.docs.botManagement.descriptionField, desc: t.docs.botManagement.descriptionDesc },
    { key: 'welcome', label: t.docs.botManagement.welcomeMessage, desc: t.docs.botManagement.welcomeMessageDesc },
    { key: 'prompt', label: t.docs.botManagement.systemPrompt, desc: t.docs.botManagement.systemPromptDesc },
    { key: 'color', label: t.docs.botManagement.themeColor, desc: t.docs.botManagement.themeColorDesc },
    { key: 'model', label: t.docs.botManagement.model, desc: t.docs.botManagement.modelDesc },
    { key: 'temp', label: t.docs.botManagement.temperature, desc: t.docs.botManagement.temperatureDesc },
    { key: 'tokens', label: t.docs.botManagement.maxTokens, desc: t.docs.botManagement.maxTokensDesc },
  ];

  const ragSteps = [
    { title: t.docs.knowledgeBase.ragStep1, desc: t.docs.knowledgeBase.ragStep1Desc },
    { title: t.docs.knowledgeBase.ragStep2, desc: t.docs.knowledgeBase.ragStep2Desc },
    { title: t.docs.knowledgeBase.ragStep3, desc: t.docs.knowledgeBase.ragStep3Desc },
    { title: t.docs.knowledgeBase.ragStep4, desc: t.docs.knowledgeBase.ragStep4Desc },
  ];

  const pricingFeatures = [
    { key: 'bots', label: t.docs.pricingPlans.bots, free: '1', pro: '5', enterprise: t.docs.pricingPlans.unlimited },
    { key: 'messages', label: t.docs.pricingPlans.messages, free: '50', pro: '5,000', enterprise: t.docs.pricingPlans.unlimited },
    { key: 'documents', label: t.docs.pricingPlans.documents, free: '1', pro: '50', enterprise: t.docs.pricingPlans.unlimited },
    { key: 'customization', label: t.docs.pricingPlans.customization, free: t.docs.pricingPlans.basic, pro: t.docs.pricingPlans.full, enterprise: t.docs.pricingPlans.full },
    { key: 'analytics', label: t.docs.pricingPlans.analytics, free: false, pro: true, enterprise: true },
    { key: 'support', label: t.docs.pricingPlans.support, free: t.docs.pricingPlans.community, pro: t.docs.pricingPlans.priority, enterprise: t.docs.pricingPlans.dedicated },
    { key: 'branding', label: t.docs.pricingPlans.branding, free: false, pro: true, enterprise: true },
    { key: 'api', label: t.docs.pricingPlans.api, free: false, pro: false, enterprise: true },
    { key: 'sso', label: t.docs.pricingPlans.sso, free: false, pro: false, enterprise: true },
    { key: 'sla', label: t.docs.pricingPlans.sla, free: false, pro: false, enterprise: true },
  ];

  const curlExample = `curl -X POST https://your-domain.com/api/chat/bot_123 \\
  -H "Authorization: Bearer sk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What is your return policy?",
    "conversationId": "conv_456"
  }'`;

  const embedCode = `<!-- SmartChat Widget -->
<script
  src="https://your-domain.com/widget.js"
  data-bot-id="your-bot-id"
  async>
</script>`;

  const renderPricingCell = (value: string | boolean) => {
    if (value === true) return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
    if (value === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <div ref={heroRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <Badge variant="secondary" className="mb-4">
            {t.docs.badge}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {t.docs.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.docs.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-10">
          {/* Sidebar - desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <DocsSidebar />
          </aside>

          {/* Mobile sidebar trigger */}
          <div className="md:hidden fixed bottom-6 left-6 z-40">
            <DocsSidebar />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-20">
            {/* Getting Started */}
            <DocsSection
              id="getting-started"
              title={t.docs.gettingStarted.title}
              description={t.docs.gettingStarted.description}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { num: 1, title: t.docs.gettingStarted.step1Title, desc: t.docs.gettingStarted.step1Description },
                  { num: 2, title: t.docs.gettingStarted.step2Title, desc: t.docs.gettingStarted.step2Description },
                  { num: 3, title: t.docs.gettingStarted.step3Title, desc: t.docs.gettingStarted.step3Description },
                  { num: 4, title: t.docs.gettingStarted.step4Title, desc: t.docs.gettingStarted.step4Description },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="relative rounded-xl border bg-background/50 p-5 hover:border-blue-600/30 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white text-sm font-bold mb-3">
                      {step.num}
                    </div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </DocsSection>

            {/* Bot Management */}
            <DocsSection
              id="bot-management"
              title={t.docs.botManagement.title}
              description={t.docs.botManagement.description}
            >
              <div className="rounded-xl border overflow-hidden">
                <div className="bg-muted/50 px-5 py-3 border-b">
                  <h3 className="font-semibold text-sm">{t.docs.botManagement.configTitle}</h3>
                </div>
                <div className="divide-y">
                  {botConfigItems.map((item) => (
                    <div key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-3">
                      <span className="font-medium text-sm w-40 shrink-0">{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DocsSection>

            {/* Knowledge Base */}
            <DocsSection
              id="knowledge-base"
              title={t.docs.knowledgeBase.title}
              description={t.docs.knowledgeBase.description}
            >
              <div className="space-y-8">
                {/* Supported formats */}
                <div>
                  <h3 className="font-semibold mb-3">{t.docs.knowledgeBase.formatsTitle}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: FileText, label: t.docs.knowledgeBase.pdf },
                      { icon: FileType, label: t.docs.knowledgeBase.txt },
                      { icon: FileEdit, label: t.docs.knowledgeBase.docx },
                      { icon: FileCode, label: t.docs.knowledgeBase.md },
                    ].map((fmt) => (
                      <div key={fmt.label} className="flex items-center gap-2 rounded-lg border p-3">
                        <fmt.icon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{fmt.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t.docs.knowledgeBase.maxSize}</p>
                </div>

                {/* RAG flow */}
                <div>
                  <h3 className="font-semibold mb-2">{t.docs.knowledgeBase.ragTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t.docs.knowledgeBase.ragDescription}</p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {ragSteps.map((step, i) => (
                      <div key={step.title} className="flex items-center gap-3 flex-1">
                        <div className="flex-1 rounded-xl border bg-gradient-to-br from-blue-600/5 to-violet-600/5 p-4 text-center">
                          <div className="font-semibold text-sm">{step.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{step.desc}</div>
                        </div>
                        {i < ragSteps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DocsSection>

            {/* Chat Widget */}
            <DocsSection
              id="chat-widget"
              title={t.docs.chatWidget.title}
              description={t.docs.chatWidget.description}
            >
              <div className="space-y-6">
                {/* Embed code */}
                <div>
                  <h3 className="font-semibold mb-2">{t.docs.chatWidget.embedTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.docs.chatWidget.embedDescription}</p>
                  <DocsCodeBlock code={embedCode} language="html" />
                </div>

                {/* Features grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { title: t.docs.chatWidget.publicBot, desc: t.docs.chatWidget.publicBotDesc },
                    { title: t.docs.chatWidget.privateBot, desc: t.docs.chatWidget.privateBotDesc },
                    { title: t.docs.chatWidget.visitorTracking, desc: t.docs.chatWidget.visitorTrackingDesc },
                    { title: t.docs.chatWidget.streaming, desc: t.docs.chatWidget.streamingDesc },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border p-4">
                      <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </DocsSection>

            {/* API Reference */}
            <DocsSection
              id="api-reference"
              title={t.docs.apiReference.title}
              description={t.docs.apiReference.description}
            >
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">{t.docs.apiReference.authDescription}</p>

                {/* Endpoints table */}
                <div className="rounded-xl border overflow-hidden">
                  <div className="bg-muted/50 px-5 py-3 border-b">
                    <h3 className="font-semibold text-sm">{t.docs.apiReference.endpointsTitle}</h3>
                  </div>
                  <div className="divide-y">
                    {apiEndpoints.map((ep) => (
                      <div key={ep.path + ep.method} className="flex items-center gap-4 px-5 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-semibold ${methodColors[ep.method]}`}>
                          {ep.method}
                        </span>
                        <code className="text-sm font-mono text-muted-foreground">{ep.path}</code>
                        <span className="text-sm text-muted-foreground ml-auto hidden sm:block">{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curl example */}
                <div>
                  <h3 className="font-semibold mb-3">{t.docs.apiReference.curlExample}</h3>
                  <DocsCodeBlock code={curlExample} language="bash" />
                </div>
              </div>
            </DocsSection>

            {/* Customization */}
            <DocsSection
              id="customization"
              title={t.docs.customization.title}
              description={t.docs.customization.description}
            >
              <div className="space-y-8">
                {/* Theme colors */}
                <div>
                  <h3 className="font-semibold mb-2">{t.docs.customization.themeTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t.docs.customization.themeDescription}</p>
                  <div className="flex flex-wrap gap-4">
                    {themeColors.map((tc) => (
                      <div key={tc.name} className="flex flex-col items-center gap-1.5">
                        <div className={`h-10 w-10 rounded-full ${tc.color} shadow-md`} />
                        <span className="text-xs text-muted-foreground">{tc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model selection */}
                <div>
                  <h3 className="font-semibold mb-2">{t.docs.customization.modelTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.docs.customization.modelDescription}</p>
                  <div className="space-y-2">
                    {[t.docs.customization.modelGpt4o, t.docs.customization.modelGpt4oMini].map((m) => (
                      <div key={m} className="flex items-center gap-2 rounded-lg border p-3">
                        <Minus className="h-3 w-3 text-blue-600 shrink-0" />
                        <span className="text-sm">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Temperature */}
                <div>
                  <h3 className="font-semibold mb-2">{t.docs.customization.temperatureTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.docs.customization.temperatureDescription}</p>
                  <div className="space-y-2">
                    {[
                      t.docs.customization.temperatureLow,
                      t.docs.customization.temperatureMedium,
                      t.docs.customization.temperatureHigh,
                    ].map((item) => (
                      <div key={item} className="rounded-lg border p-3">
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System prompt tips */}
                <div>
                  <h3 className="font-semibold mb-3">{t.docs.customization.promptTitle}</h3>
                  <div className="space-y-2">
                    {[
                      t.docs.customization.promptTip1,
                      t.docs.customization.promptTip2,
                      t.docs.customization.promptTip3,
                      t.docs.customization.promptTip4,
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DocsSection>

            {/* Pricing Plans */}
            <DocsSection
              id="pricing-plans"
              title={t.docs.pricingPlans.title}
              description={t.docs.pricingPlans.description}
            >
              <div className="space-y-6">
                <div className="rounded-xl border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-5 py-3 font-semibold">{t.docs.pricingPlans.feature}</th>
                        <th className="text-center px-5 py-3 font-semibold">{t.docs.pricingPlans.free}</th>
                        <th className="text-center px-5 py-3 font-semibold">
                          <span className="inline-flex items-center gap-1">
                            {t.docs.pricingPlans.pro}
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Popular</Badge>
                          </span>
                        </th>
                        <th className="text-center px-5 py-3 font-semibold">{t.docs.pricingPlans.enterprise}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pricingFeatures.map((row) => (
                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-medium">{row.label}</td>
                          <td className="px-5 py-3 text-center">{renderPricingCell(row.free)}</td>
                          <td className="px-5 py-3 text-center">{renderPricingCell(row.pro)}</td>
                          <td className="px-5 py-3 text-center">{renderPricingCell(row.enterprise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-center">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
                    asChild
                  >
                    <Link href="/#pricing">{t.docs.pricingPlans.viewPricing}</Link>
                  </Button>
                </div>
              </div>
            </DocsSection>
          </div>
        </div>
      </div>
    </div>
  );
}
