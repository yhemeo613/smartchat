'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface CreateBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (data: {
    name: string;
    description: string;
    welcome_message: string;
    system_prompt: string;
    theme_color: string;
    model: string;
  }) => void;
}

export function CreateBotDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateBotDialogProps) {
  const { t } = useI18n();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [model, setModel] = useState('gpt-4o');
  const [models, setModels] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/user/ai-settings')
      .then((res) => res.json())
      .then((data) => {
        const preset = getPresetById(data.ai_provider);
        const presetModels = preset?.models ?? PROVIDER_PRESETS[0].models;
        setModels(presetModels);
        if (presetModels.length > 0 && !presetModels.some((m) => m.value === model)) {
          setModel(presetModels[0].value);
        }
      })
      .catch(() => {
        setModels(PROVIDER_PRESETS[0].models);
      });
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    await onCreate?.({
      name,
      description,
      welcome_message: welcomeMessage,
      system_prompt: systemPrompt,
      theme_color: themeColor,
      model,
    });
    setIsCreating(false);
    setName('');
    setDescription('');
    setWelcomeMessage('');
    setSystemPrompt('');
    setThemeColor('#6366f1');
    setModel('gpt-4o');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.dashboard.createBot}</DialogTitle>
          <DialogDescription>
            {t.dashboard.createBotDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="bot-name">{t.dashboard.botForm.name}</Label>
            <Input
              id="bot-name"
              placeholder={t.dashboard.botForm.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bot-description">
              {t.dashboard.botForm.description}
            </Label>
            <Input
              id="bot-description"
              placeholder={t.dashboard.botForm.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bot-welcome">
              {t.dashboard.botForm.welcomeMessage}
            </Label>
            <Input
              id="bot-welcome"
              placeholder={t.dashboard.botForm.welcomePlaceholder}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bot-system-prompt">
              {t.dashboard.botForm.systemPrompt}
            </Label>
            <Textarea
              id="bot-system-prompt"
              placeholder={t.dashboard.botForm.systemPromptPlaceholder}
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            {t.dashboard.botForm.cancel}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating
              ? t.dashboard.botForm.creating
              : t.dashboard.botForm.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
