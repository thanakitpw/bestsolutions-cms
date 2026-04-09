'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HomeSettings {
  hero_title_en: string;
  hero_title_th: string;
  hero_subtitle_en: string;
  hero_subtitle_th: string;
  hero_image: string;
}

const defaultSettings: HomeSettings = {
  hero_title_en: '',
  hero_title_th: '',
  hero_subtitle_en: '',
  hero_subtitle_th: '',
  hero_image: '',
};

export default function HomePageEditor() {
  const [form, setForm] = useState<HomeSettings>(defaultSettings);
  const [lang, setLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setForm({
          hero_title_en: data.hero_title_en ?? '',
          hero_title_th: data.hero_title_th ?? '',
          hero_subtitle_en: data.hero_subtitle_en ?? '',
          hero_subtitle_th: data.hero_subtitle_th ?? '',
          hero_image: data.hero_image ?? '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const update = (field: keyof HomeSettings, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">Home Page</h1>
          <p className="text-[13px] text-[#999]">Edit home page content</p>
        </div>
        <div className="flex items-center justify-center py-20 text-[13px] text-[#999]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">Home Page</h1>
          <p className="text-[13px] text-[#999]">Edit home page content</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Language Tabs */}
      <Tabs value={lang} onValueChange={setLang}>
        <TabsList>
          <TabsTrigger value="en">EN</TabsTrigger>
          <TabsTrigger value="th">TH</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Hero Section */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <span className="text-[15px] font-bold text-[#1A1A1A]">Hero Section</span>

          {/* Hero Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
              Hero Title {lang === 'en' ? '(English)' : '(ภาษาไทย)'}
            </Label>
            {lang === 'en' ? (
              <Input
                value={form.hero_title_en}
                onChange={e => update('hero_title_en', e.target.value)}
                placeholder="e.g. Design That Speaks"
              />
            ) : (
              <Input
                value={form.hero_title_th}
                onChange={e => update('hero_title_th', e.target.value)}
                placeholder="เช่น ออกแบบที่พูดแทนคุณ"
              />
            )}
          </div>

          {/* Hero Subtitle */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
              Hero Subtitle {lang === 'en' ? '(English)' : '(ภาษาไทย)'}
            </Label>
            {lang === 'en' ? (
              <Input
                value={form.hero_subtitle_en}
                onChange={e => update('hero_subtitle_en', e.target.value)}
                placeholder="e.g. Interior · Architecture · Furniture"
              />
            ) : (
              <Input
                value={form.hero_subtitle_th}
                onChange={e => update('hero_subtitle_th', e.target.value)}
                placeholder="เช่น ออกแบบภายใน · สถาปัตยกรรม · เฟอร์นิเจอร์"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hero Image */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <span className="text-[15px] font-bold text-[#1A1A1A]">Hero Image</span>
          {form.hero_image && (
            <div className="relative aspect-video w-full max-w-lg overflow-hidden rounded-lg bg-[#F0EFED]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.hero_image} alt="Hero preview" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Image URL</Label>
            <Input
              value={form.hero_image}
              onChange={e => update('hero_image', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
