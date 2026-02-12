'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Package,
  RotateCcw,
  Tag,
  MessageSquare,
  ArrowLeft,
  Lock,
  Sparkles,
  Lightbulb,
  Info,
} from 'lucide-react';

const DEMO_THEME_COLOR = '#6366f1';
const GUEST_QUOTA = 3;
const STORAGE_KEY = 'smartchat-demo-count';

// Simulated e-commerce agent responses
const DEMO_RESPONSES: Record<string, Record<string, string>> = {
  en: {
    default:
      "Thanks for your question! As ShopSmart's AI assistant, I can help with product inquiries, order tracking, returns, and promotions. Could you be more specific about what you'd like to know?",
    return:
      "Our return policy is simple and customer-friendly:\n\n• **30-day return window** for most items\n• **Electronics**: 15-day return with original packaging\n• **Clothing**: 30-day return, tags must be attached\n• **Free return shipping** for defective items\n\nTo initiate a return, go to My Orders → Select Order → Request Return. Refunds are processed within 3-5 business days.",
    order:
      "I'd be happy to help you track your order! Here's a sample status:\n\n📦 **Order #SH-20250210-8842**\n• Status: **In Transit**\n• Shipped: Feb 10, 2025\n• Carrier: SF Express\n• Estimated delivery: Feb 13-14, 2025\n\nYou can track real-time updates in My Orders. Need anything else?",
    promotion:
      "Great timing! Here are our current promotions:\n\n🔥 **Spring Sale** - Up to 40% off selected items\n💳 **New User Coupon** - ¥50 off on orders over ¥200\n🎁 **Buy 2 Get 1 Free** - On all accessories\n⭐ **VIP Members** - Extra 10% off + free shipping\n\nUse code **SPRING2025** at checkout for an additional 5% off!",
    shipping:
      "Here's our shipping information:\n\n🚚 **Standard Shipping**: 3-5 business days (Free for orders over ¥99)\n⚡ **Express Shipping**: 1-2 business days (¥15)\n🌍 **International**: 7-15 business days (varies by region)\n\nAll orders include tracking. You'll receive a notification once your order ships.",
  },
  zh: {
    default:
      "感谢您的提问！作为智购商城的 AI 助手，我可以帮您处理商品咨询、订单追踪、退换货和优惠活动等问题。请问您具体想了解什么呢？",
    return:
      "我们的退换货政策简单便捷：\n\n• **大部分商品** 支持 30 天无理由退货\n• **电子产品**：15 天内可退，需保留原包装\n• **服装类**：30 天内可退，吊牌须完好\n• **质量问题** 免费退货运费\n\n发起退货：进入 我的订单 → 选择订单 → 申请退货。退款将在 3-5 个工作日内处理完成。",
    order:
      "很高兴为您查询订单！以下是一个示例状态：\n\n📦 **订单号 #SH-20250210-8842**\n• 状态：**运输中**\n• 发货时间：2025年2月10日\n• 承运商：顺丰速运\n• 预计送达：2025年2月13-14日\n\n您可以在「我的订单」中查看实时物流更新。还需要其他帮助吗？",
    promotion:
      "您来得正好！以下是我们当前的优惠活动：\n\n🔥 **春季大促** - 精选商品低至6折\n💳 **新人专享券** - 满200减50\n🎁 **配件买二送一** - 全场配件参与\n⭐ **VIP 会员** - 额外9折 + 免运费\n\n结算时使用优惠码 **SPRING2025** 还可再享95折！",
    shipping:
      "以下是我们的配送信息：\n\n🚚 **标准配送**：3-5 个工作日（满99元免运费）\n⚡ **极速配送**：1-2 个工作日（运费15元）\n🌍 **国际配送**：7-15 个工作日（费用因地区而异）\n\n所有订单均支持物流追踪，发货后您会收到通知。",
  },
};

// Simple heuristic: if the message contains any CJK character, treat it as Chinese
function detectLanguage(message: string): 'zh' | 'en' {
  return /[\u4e00-\u9fff]/.test(message) ? 'zh' : 'en';
}

function getResponseForMessage(message: string): string {
  const lower = message.toLowerCase();
  const lang = detectLanguage(message);
  const responses = DEMO_RESPONSES[lang];
  if (lower.includes('return') || lower.includes('refund') || lower.includes('退') || lower.includes('换'))
    return responses.return;
  if (lower.includes('order') || lower.includes('track') || lower.includes('订单') || lower.includes('查'))
    return responses.order;
  if (lower.includes('promot') || lower.includes('coupon') || lower.includes('deal') || lower.includes('discount') || lower.includes('优惠') || lower.includes('活动') || lower.includes('折'))
    return responses.promotion;
  if (lower.includes('ship') || lower.includes('deliver') || lower.includes('发货') || lower.includes('物流') || lower.includes('快递') || lower.includes('收到'))
    return responses.shipping;
  return responses.default;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Guest fallback using localStorage
function getGuestCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

function incrementGuestCount(): number {
  const count = getGuestCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(count));
  return count;
}

export default function DemoPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quota, setQuota] = useState(GUEST_QUOTA);
  const [used, setUsed] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/demo')
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setLoggedIn(true);
          setQuota(data.quota);
          setUsed(data.used);
          if (data.used >= data.quota) setLimitReached(true);
        } else {
          // Guest: use localStorage
          const count = getGuestCount();
          setUsed(count);
          setQuota(GUEST_QUOTA);
          if (count >= GUEST_QUOTA) setLimitReached(true);
        }
      })
      .catch(() => {
        // Fallback to guest mode
        const count = getGuestCount();
        setUsed(count);
        if (count >= GUEST_QUOTA) setLimitReached(true);
      });
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = async (content: string) => {
    if (limitReached) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Update quota
    let newUsed = used + 1;
    if (loggedIn) {
      try {
        const res = await fetch('/api/demo', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          newUsed = data.used;
        } else if (res.status === 403) {
          setLimitReached(true);
          setIsTyping(false);
          return;
        }
      } catch {
        // Fallback: still allow the message
      }
    } else {
      newUsed = incrementGuestCount();
    }
    setUsed(newUsed);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

    const response = getResponseForMessage(content);
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, assistantMsg]);

    if (newUsed >= quota) {
      setLimitReached(true);
    }
  };

  const remaining = quota - used;
  const scenarioIcons = [ShoppingCart, Package, RotateCcw, Tag];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/bots" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-500" />
              <span className="font-semibold text-sm">SmartChat</span>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px]">
              {t.demo.badge}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {!limitReached && (
              <span className="text-xs text-muted-foreground">
                {remaining} {t.demo.remainingChats}
              </span>
            )}
            <Link href="/signup">
              <Button size="sm" variant="outline" className="text-xs">
                {t.demo.signUp}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold tracking-tight">{t.demo.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            {t.demo.subtitle}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Background */}
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="size-4 text-indigo-500" />
                <h2 className="text-sm font-semibold">{t.demo.background.title}</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.demo.background.content}
              </p>
            </div>

            {/* Use Cases */}
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="size-4 text-indigo-500" />
                <h2 className="text-sm font-semibold">{t.demo.scenarios.title}</h2>
              </div>
              <div className="space-y-2.5">
                {t.demo.scenarios.items.map((item: string, i: number) => {
                  const Icon = scenarioIcons[i];
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="size-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="size-3.5 text-indigo-500" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="size-4 text-amber-500" />
                <h2 className="text-sm font-semibold">{t.demo.tips.title}</h2>
              </div>
              <div className="space-y-2">
                {t.demo.tips.items.map((item: string, i: number) => (
                  <p
                    key={i}
                    className="text-xs text-muted-foreground bg-amber-50/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 transition-colors"
                    onClick={() => {
                      if (!limitReached && !isTyping) {
                        const clean = item.replace(/["""]/g, '');
                        handleSend(clean);
                      }
                    }}
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Chat Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="rounded-xl border bg-white overflow-hidden shadow-sm h-[600px] flex flex-col">
              {/* Chat Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
                style={{ backgroundColor: DEMO_THEME_COLOR }}
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  🛒
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold leading-tight">{t.demo.botName}</h3>
                  <p className="text-xs opacity-80">Online</p>
                </div>
                {!limitReached && (
                  <Badge className="bg-white/20 text-white hover:bg-white/20 text-[10px]">
                    {remaining}/{quota}
                  </Badge>
                )}
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1">
                <MessageBubble
                  role="assistant"
                  content={t.demo.welcomeMessage}
                  themeColor={DEMO_THEME_COLOR}
                />

                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    themeColor={DEMO_THEME_COLOR}
                  />
                ))}

                {isTyping && <TypingIndicator />}
              </div>

              {/* Limit Reached Overlay or Input */}
              <AnimatePresence>
                {limitReached ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t p-5 bg-slate-50 text-center"
                  >
                    <div className="flex justify-center mb-2">
                      <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Lock className="size-4 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{t.demo.limitReached}</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {t.demo.limitDescription}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Link href="/signup">
                        <Button size="sm" className="text-xs">
                          {t.demo.signUp}
                        </Button>
                      </Link>
                      <Link href="/dashboard/bots">
                        <Button size="sm" variant="outline" className="text-xs">
                          {t.demo.backToDashboard}
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <ChatInput
                    onSend={handleSend}
                    disabled={isTyping}
                    placeholder={t.chat.placeholder}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
