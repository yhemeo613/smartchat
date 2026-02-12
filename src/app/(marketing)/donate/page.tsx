'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import wechatQR from '@/asset/image/wechat.jpg';
import alipayQR from '@/asset/image/alipay.jpg';

export default function DonatePage() {
  const { t } = useI18n();

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            <Heart className="h-3.5 w-3.5 mr-1.5 text-red-500" />
            {t.donate.title}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t.donate.title}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            {t.donate.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid sm:grid-cols-2 gap-8"
        >
          {/* WeChat Pay */}
          <div className="rounded-2xl border bg-background/50 p-6 text-center hover:border-green-500/30 hover:shadow-lg transition-all">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700">{t.donate.wechat}</span>
            </div>
            <div className="relative w-56 h-56 mx-auto rounded-xl overflow-hidden border">
              <Image
                src={wechatQR}
                alt={t.donate.wechat}
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Alipay */}
          <div className="rounded-2xl border bg-background/50 p-6 text-center hover:border-blue-500/30 hover:shadow-lg transition-all">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-blue-700">{t.donate.alipay}</span>
            </div>
            <div className="relative w-56 h-56 mx-auto rounded-xl overflow-hidden border">
              <Image
                src={alipayQR}
                alt={t.donate.alipay}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-10"
        >
          {t.donate.thanks}
        </motion.p>
      </div>
    </div>
  );
}
