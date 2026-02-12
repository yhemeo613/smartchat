'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Globe,
  Loader2,
  Bot,
  Check,
  X,
} from 'lucide-react';
import type { Locale } from '@/types';
import { PROVIDER_PRESETS, getPresetById } from '@/lib/ai/providers';

interface AISettings {
  ai_provider: string;
  ai_api_key: string;
  ai_base_url: string;
  default_model: string;
  has_api_key: boolean;
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const s = t.dashboard.settingsPage;
  const { user, profile } = useUser();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // AI config state
  const [aiSettings, setAiSettings] = useState<AISettings>({
    ai_provider: 'openai',
    ai_api_key: '',
    ai_base_url: '',
    default_model: 'gpt-4o-mini',
    has_api_key: false,
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customModel, setCustomModel] = useState('');

  const currentPreset = getPresetById(aiSettings.ai_provider);
  const models = currentPreset?.models ?? [];

  // Load real user data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [user, profile]);

  // Load AI settings
  useEffect(() => {
    async function loadAiSettings() {
      try {
        const res = await fetch('/api/user/ai-settings');
        if (res.ok) {
          const data = await res.json();
          setAiSettings(data);
        }
      } catch {
        // ignore load errors
      }
    }
    if (user) {
      loadAiSettings();
    }
  }, [user]);

  const handleProviderChange = (providerId: string) => {
    const preset = getPresetById(providerId);
    setAiSettings((prev) => ({
      ...prev,
      ai_provider: providerId,
      ai_base_url: preset?.baseUrl || '',
      default_model: preset?.models[0]?.value || prev.default_model,
    }));
    setCustomModel('');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);
    if (error) {
      alert('Failed to save profile: ' + error.message);
    }
    setSaving(false);
  };

  const handleSaveAiConfig = async () => {
    setAiSaving(true);
    setAiMessage(null);
    try {
      const modelToSave = aiSettings.ai_provider === 'custom' && customModel
        ? customModel
        : aiSettings.default_model;

      const res = await fetch('/api/user/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_provider: aiSettings.ai_provider,
          ai_api_key: aiSettings.ai_api_key,
          ai_base_url: aiSettings.ai_base_url,
          default_model: modelToSave,
        }),
      });
      if (res.ok) {
        setAiMessage({ type: 'success', text: s.aiConfigSaved });
        // Reload to get masked keys
        const reloadRes = await fetch('/api/user/ai-settings');
        if (reloadRes.ok) {
          setAiSettings(await reloadRes.json());
        }
      } else {
        setAiMessage({ type: 'error', text: s.aiConfigError });
      }
    } catch {
      setAiMessage({ type: 'error', text: s.aiConfigError });
    }
    setAiSaving(false);
    setTimeout(() => setAiMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">{s.profile}</CardTitle>
          </div>
          <CardDescription>{s.profileDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="settings-name">{s.name}</Label>
              <Input
                id="settings-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="settings-email">{s.email}</Label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {s.saveProfile}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Configuration Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">{s.aiConfig}</CardTitle>
          </div>
          <CardDescription>{s.aiConfigDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Provider + Status */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{s.provider}</Label>
              <Badge variant={aiSettings.has_api_key ? 'default' : 'secondary'} className="text-[10px]">
                {aiSettings.has_api_key ? s.configured : s.notConfigured}
              </Badge>
            </div>
            <Select
              value={aiSettings.ai_provider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="ai-key" className="text-xs">{s.apiKey}</Label>
                <Input
                  id="ai-key"
                  type="password"
                  placeholder={s.apiKeyPlaceholder}
                  value={aiSettings.ai_api_key}
                  onChange={(e) => setAiSettings((prev) => ({ ...prev, ai_api_key: e.target.value }))}
                  className="h-8 font-mono text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ai-url" className="text-xs">{s.baseUrl}</Label>
                <Input
                  id="ai-url"
                  placeholder={s.baseUrlPlaceholder}
                  value={aiSettings.ai_base_url}
                  onChange={(e) => setAiSettings((prev) => ({ ...prev, ai_base_url: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Default Model */}
          <div className="grid gap-1.5">
            <Label className="text-xs">{s.defaultModel}</Label>
            {aiSettings.ai_provider === 'custom' ? (
              <Input
                placeholder={s.customModelPlaceholder}
                value={customModel || aiSettings.default_model}
                onChange={(e) => {
                  setCustomModel(e.target.value);
                  setAiSettings((prev) => ({ ...prev, default_model: e.target.value }));
                }}
                className="w-64 h-8 text-xs"
              />
            ) : (
              <Select
                value={aiSettings.default_model}
                onValueChange={(val) => setAiSettings((prev) => ({ ...prev, default_model: val }))}
              >
                <SelectTrigger className="w-64 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Save + Message */}
          <div className="flex items-center justify-between">
            {aiMessage && (
              <div className={`flex items-center gap-1.5 text-xs ${aiMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                {aiMessage.type === 'success' ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                {aiMessage.text}
              </div>
            )}
            <div className="ml-auto">
              <Button size="sm" onClick={handleSaveAiConfig} disabled={aiSaving}>
                {aiSaving && <Loader2 className="size-3.5 animate-spin" />}
                {s.saveAiConfig}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">{s.language}</CardTitle>
          </div>
          <CardDescription>{s.languageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={locale}
            onValueChange={(val) => setLocale(val as Locale)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
