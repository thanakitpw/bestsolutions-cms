'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AboutSettings {
  about_title_en: string;
  about_title_th: string;
  about_description_en: string;
  about_description_th: string;
  philosophy_en: string;
  philosophy_th: string;
}

const defaultSettings: AboutSettings = {
  about_title_en: '',
  about_title_th: '',
  about_description_en: '',
  about_description_th: '',
  philosophy_en: '',
  philosophy_th: '',
};

export default function AboutPageEditor() {
  const [form, setForm] = useState<AboutSettings>(defaultSettings);
  const [lang, setLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setForm({
          about_title_en: data.about_title_en ?? '',
          about_title_th: data.about_title_th ?? '',
          about_description_en: data.about_description_en ?? '',
          about_description_th: data.about_description_th ?? '',
          philosophy_en: data.philosophy_en ?? '',
          philosophy_th: data.philosophy_th ?? '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const update = (field: keyof AboutSettings, value: string) => {
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
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">About Page</h1>
          <p className="text-[13px] text-[#999]">Edit about page content</p>
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
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">About Page</h1>
          <p className="text-[13px] text-[#999]">Edit about page content</p>
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

      {/* About Section */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <span className="text-[15px] font-bold text-[#1A1A1A]">About Section</span>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
              Title {lang === 'en' ? '(English)' : '(ภาษาไทย)'}
            </Label>
            {lang === 'en' ? (
              <Input
                value={form.about_title_en}
                onChange={e => update('about_title_en', e.target.value)}
                placeholder="e.g. Two Desks Studio"
              />
            ) : (
              <Input
                value={form.about_title_th}
                onChange={e => update('about_title_th', e.target.value)}
                placeholder="เช่น ทูเดสก์ สตูดิโอ"
              />
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
              Description {lang === 'en' ? '(English)' : '(ภาษาไทย)'}
            </Label>
            {lang === 'en' ? (
              <Textarea
                value={form.about_description_en}
                onChange={e => update('about_description_en', e.target.value)}
                placeholder="Studio introduction in English..."
                rows={5}
              />
            ) : (
              <Textarea
                value={form.about_description_th}
                onChange={e => update('about_description_th', e.target.value)}
                placeholder="แนะนำสตูดิโอภาษาไทย..."
                rows={5}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Philosophy Section */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <span className="text-[15px] font-bold text-[#1A1A1A]">Design Philosophy</span>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
              Philosophy {lang === 'en' ? '(English)' : '(ภาษาไทย)'}
            </Label>
            {lang === 'en' ? (
              <Textarea
                value={form.philosophy_en}
                onChange={e => update('philosophy_en', e.target.value)}
                placeholder="Our design philosophy in English..."
                rows={5}
              />
            ) : (
              <Textarea
                value={form.philosophy_th}
                onChange={e => update('philosophy_th', e.target.value)}
                placeholder="แนวคิดการออกแบบภาษาไทย..."
                rows={5}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
