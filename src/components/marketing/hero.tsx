'use client';

import { motion, easeOut } from 'framer-motion';
import { ArrowRight, Play, Bot, User, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: easeOut },
  }),
};

const chatMessages = [
  { role: 'user' as const, text: 'How do I integrate the API?' },
  {
    role: 'bot' as const,
    text: 'Great question! You can integrate our API in 3 simple steps:\n1. Get your API key\n2. Install the SDK\n3. Initialize the client',
  },
  { role: 'user' as const, text: 'Which languages are supported?' },
  {
    role: 'bot' as const,
    text: 'We support JavaScript, Python, Go, Ruby, and Java. Check our docs for examples!',
  },
];

function ChatMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: easeOut }}
      className="relative w-full max-w-sm mx-auto"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-3xl blur-2xl" />

      <div className="relative bg-background/95 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-violet-600">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">SmartChat AI</p>
            <p className="text-xs text-white/70">Online</p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex flex-col gap-3 p-4 h-64 overflow-hidden">
          {chatMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 + i * 0.3 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'bot' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 mt-0.5">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Chat input */}
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <span className="text-xs text-muted-foreground">Type a message...</span>
            <div className="ml-auto h-6 w-6 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center">
              <ArrowRight className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-violet-600/10 to-transparent rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <Badge
                variant="outline"
                className="mb-6 px-4 py-1.5 text-sm font-medium border-blue-600/30 text-blue-600 dark:text-blue-400 bg-blue-600/5"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {t.hero.badge}
              </Badge>
            </motion.div>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              {t.hero.title}{' '}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {t.hero.description}
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 shadow-lg hover:shadow-xl transition-all text-base px-8 h-12"
                asChild
              >
                <Link href="/signup">
                  {t.hero.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base h-12 px-8"
                asChild
              >
                <Link href="/demo">
                  <Play className="mr-2 h-4 w-4" />
                  {t.hero.ctaSecondary}
                </Link>
              </Button>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto lg:mx-0"
            >
              {[
                { label: t.hero.stats.responses, value: t.hero.stats.responsesValue },
                { label: t.hero.stats.accuracy, value: t.hero.stats.accuracyValue },
                { label: t.hero.stats.languages, value: t.hero.stats.languagesValue },
              ].map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Chat mockup */}
          <div className="hidden lg:block">
            <ChatMockup />
          </div>
        </div>

        {/* Mobile chat mockup */}
        <div className="lg:hidden mt-12">
          <ChatMockup />
        </div>
      </div>
    </section>
  );
}
