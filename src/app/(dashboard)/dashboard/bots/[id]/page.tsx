'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentUpload } from '@/components/dashboard/document-upload';
import { EmbedCode } from '@/components/dashboard/embed-code';
import { ChatPreview } from '@/components/dashboard/chat-preview';
import {
  Settings,
  BookOpen,
  Code2,
  MessageSquare,
  BarChart3,
  ArrowLeft,
  User,
  TrendingUp,
  Clock,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { Bot, Document as DocType, Conversation } from '@/types';
import { PROVIDER_PRESETS, getPresetById } from '@/lib/ai/providers';

const THEME_COLORS = [
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

// Models will be loaded from user's AI settings

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default function BotDetailPage() {
  const params = useParams();
  const { t } = useI18n();
  const botId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bot, setBot] = useState<Bot | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);

  // Data state
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [conversations, setConversations] = useState<(Conversation & { messageCount: number })[]>([]);
  const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0, avgMessages: 0 });
  const [models, setModels] = useState<{ value: string; label: string }[]>(PROVIDER_PRESETS[0].models.map(m => ({ ...m })));

  const fetchBot = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .eq('user_id', user.id)
      .single();

    if (data) {
      setBot(data);
      setName(data.name);
      setDescription(data.description);
      setWelcomeMessage(data.welcome_message);
      setSystemPrompt(data.system_prompt);
      setThemeColor(data.theme_color);
      setModel(data.model);
      setTemperature(data.temperature);
    }
    setLoading(false);
  }, [botId]);

  const fetchDocuments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false });
    setDocuments(data ?? []);
  }, [botId]);

  const fetchConversations = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('conversations')
      .select('*, messages(count)')
      .eq('bot_id', botId)
      .order('updated_at', { ascending: false });

    const convs = (data ?? []).map((conv) => ({
      ...conv,
      messageCount: (conv.messages as unknown as { count: number }[])?.[0]?.count ?? 0,
    }));
    setConversations(convs);

    // Calculate stats
    const totalConversations = convs.length;
    const totalMessages = convs.reduce((sum, c) => sum + c.messageCount, 0);
    const avgMessages = totalConversations > 0
      ? Math.round(totalMessages / totalConversations * 10) / 10
      : 0;
    setStats({ totalConversations, totalMessages, avgMessages });
  }, [botId]);

  useEffect(() => {
    fetchBot();
    fetchDocuments();
    fetchConversations();
  }, [fetchBot, fetchDocuments, fetchConversations]);

  useEffect(() => {
    fetch('/api/user/ai-settings')
      .then((res) => res.json())
      .then((data) => {
        const preset = getPresetById(data.ai_provider);
        if (preset?.models.length) {
          setModels(preset.models.map(m => ({ ...m })));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('bots')
      .update({
        name,
        description,
        welcome_message: welcomeMessage,
        system_prompt: systemPrompt,
        theme_color: themeColor,
        model,
        temperature,
      })
      .eq('id', botId);
    if (error) {
      alert('Failed to save bot settings: ' + error.message);
    }
    setSaving(false);
  };

  const handleDeleteDoc = async (id: string) => {
    // If it's a temp/placeholder document (failed or processing upload), just remove from UI
    if (id.startsWith('temp-')) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      return;
    }

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert('Failed to delete document: ' + (data.error || 'Unknown error'));
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert('Failed to delete document');
    }
  };

  const handleUpload = async (files: File[]) => {
    const supabase = createClient();

    for (const file of files) {
      // Add placeholder
      const tempId = `temp-${Date.now()}-${file.name}`;
      setDocuments((prev) => [
        {
          id: tempId,
          bot_id: botId,
          name: file.name,
          content: '',
          token_count: 0,
          status: 'processing' as const,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      try {
        // Upload file to Supabase Storage first
        const filePath = `${botId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Then call API with file path instead of file body
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath,
            fileName: file.name,
            botId,
          }),
        });
        const result = await res.json();

        if (res.ok) {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === tempId
                ? { ...d, id: result.id, status: 'ready' as const, token_count: result.token_count }
                : d
            )
          );
        } else {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === tempId ? { ...d, status: 'error' as const } : d
            )
          );
        }
      } catch {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === tempId ? { ...d, status: 'error' as const } : d
          )
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">Bot not found</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/dashboard/bots">
            <ArrowLeft className="size-3.5" />
            Back to bots
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/dashboard/bots">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{name}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="size-3.5" />
            {t.dashboard.tabs.settings}
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5">
            <BookOpen className="size-3.5" />
            {t.dashboard.tabs.knowledgeBase}
          </TabsTrigger>
          <TabsTrigger value="embed" className="gap-1.5">
            <Code2 className="size-3.5" />
            {t.dashboard.tabs.embed}
          </TabsTrigger>
          <TabsTrigger value="conversations" className="gap-1.5">
            <MessageSquare className="size-3.5" />
            {t.dashboard.tabs.conversations}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="size-3.5" />
            {t.dashboard.tabs.analytics}
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t.dashboard.tabs.settings}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t.dashboard.botForm.name}</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-desc">
                  {t.dashboard.botForm.description}
                </Label>
                <Input
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-welcome">
                  {t.dashboard.botForm.welcomeMessage}
                </Label>
                <Input
                  id="edit-welcome"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-system">
                  {t.dashboard.botForm.systemPrompt}
                </Label>
                <Textarea
                  id="edit-system"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t.dashboard.botForm.themeColor}</Label>
                <div className="flex items-center gap-2">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          themeColor === color ? 'white' : 'transparent',
                        boxShadow:
                          themeColor === color
                            ? `0 0 0 2px ${color}`
                            : 'none',
                      }}
                      onClick={() => setThemeColor(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t.dashboard.botForm.model}</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-temp">
                    {t.dashboard.botForm.temperature}: {temperature}
                  </Label>
                  <input
                    id="edit-temp"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) =>
                      setTemperature(parseFloat(e.target.value))
                    }
                    className="mt-2 w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="size-3.5 animate-spin" />}
                  {t.dashboard.botForm.save}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t.dashboard.knowledgeBase}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload
                documents={documents}
                onUpload={handleUpload}
                onDelete={handleDeleteDoc}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed Tab */}
        <TabsContent value="embed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t.dashboard.embed}</CardTitle>
            </CardHeader>
            <CardContent>
              <EmbedCode botId={botId} />
              <ChatPreview botId={botId} botName={name} themeColor={themeColor} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t.dashboard.conversations}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <MessageSquare className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t.dashboard.conversationsEmpty}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.dashboard.visitor} {conv.visitor_id.slice(-4)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-[10px]">
                          {conv.messageCount} {t.dashboard.messagesCount}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(conv.updated_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="py-4">
              <CardContent className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50">
                  <MessageSquare className="size-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.dashboard.totalConversations}
                  </p>
                  <p className="text-lg font-semibold">{stats.totalConversations}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50">
                  <TrendingUp className="size-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.dashboard.totalMessages}
                  </p>
                  <p className="text-lg font-semibold">{stats.totalMessages}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50">
                  <Clock className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.dashboard.avgResponseTime}
                  </p>
                  <p className="text-lg font-semibold">--</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">
                {t.dashboard.analytics}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground max-w-md">
                  {t.dashboard.analyticsPlaceholder}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
