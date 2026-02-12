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
  Key,
  CreditCard,
  Globe,
  Plus,
  Trash2,
  Zap,
  Loader2,
} from 'lucide-react';
import type { Locale } from '@/types';

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const s = t.dashboard.settingsPage;
  const { user, profile } = useUser();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<
    { id: string; name: string; prefix: string; lastUsed: string | null; created: string }[]
  >([]);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  // Load real user data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [user, profile]);

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

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const newKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      prefix: `sk-new-****${Math.random().toString(36).slice(-4)}`,
      lastUsed: null,
      created: new Date().toISOString(),
    };
    setApiKeys((prev) => [...prev, newKey]);
    setNewKeyName('');
    setShowKeyForm(false);
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

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">{s.apiKeys}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeyForm(!showKeyForm)}
            >
              <Plus className="size-3.5" />
              {s.createKey}
            </Button>
          </div>
          <CardDescription>{s.apiKeysDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showKeyForm && (
            <div className="flex items-end gap-2 rounded-lg border p-3 bg-muted/30">
              <div className="flex-1 grid gap-1.5">
                <Label htmlFor="new-key-name" className="text-xs">
                  {s.keyName}
                </Label>
                <Input
                  id="new-key-name"
                  placeholder="e.g. Production"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="h-8"
                />
              </div>
              <Button size="sm" onClick={handleCreateKey}>
                {s.createKey}
              </Button>
            </div>
          )}

          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No API keys yet.
            </p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{key.name}</p>
                      <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                        {key.prefix}
                      </code>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>
                        {s.lastUsed}:{' '}
                        {key.lastUsed
                          ? new Date(key.lastUsed).toLocaleDateString()
                          : s.never}
                      </span>
                      <span>
                        {s.created}:{' '}
                        {new Date(key.created).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleRevokeKey(key.id)}
                  >
                    <Trash2 className="size-3.5" />
                    {s.revoke}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">{s.billing}</CardTitle>
          </div>
          <CardDescription>{s.billingDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-50">
                <Zap className="size-5 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Free</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.currentPlan}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">$0/month</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {s.upgradePlan}
            </Button>
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
