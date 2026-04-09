'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Settings {
  company_name: string;
  tagline_th: string;
  tagline_en: string;
  email: string;
  phone: string;
  address_th: string;
  address_en: string;
  instagram_url: string;
  facebook_url: string;
  seo_title: string;
  seo_description: string;
}

const DEFAULT_SETTINGS: Settings = {
  company_name: '',
  tagline_th: '',
  tagline_en: '',
  email: '',
  phone: '',
  address_th: '',
  address_en: '',
  instagram_url: '',
  facebook_url: '',
  seo_title: '',
  seo_description: '',
};

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-[#1A1A1A]">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        if (res.ok) {
          setSettings((prev) => ({ ...prev, ...json }));
        } else {
          toast.error(json.error ?? 'Failed to load settings');
        }
      } catch {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  function handleChange(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Settings saved');
      } else {
        toast.error(json.error ?? 'Failed to save settings');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">General Settings</h1>
          <p className="text-[13px] text-[#999]">Configure your website and admin panel</p>
        </div>
        <div className="rounded-lg border border-[#E5E4E2] bg-white p-6">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-[#F0EFED]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">General Settings</h1>
          <p className="text-[13px] text-[#999]">Configure your website and admin panel</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white hover:bg-black"
        >
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Company Info */}
      <div className="rounded-lg border border-[#E5E4E2] bg-white p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-[#1A1A1A]">Company Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="company_name" label="Company Name">
            <Input
              id="company_name"
              value={settings.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="TWO DESKS"
              className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
          <Field id="email" label="Email">
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="hello@twodesk.studio"
              className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
          <Field id="tagline_th" label="Tagline (Thai)">
            <Input
              id="tagline_th"
              value={settings.tagline_th}
              onChange={(e) => handleChange('tagline_th', e.target.value)}
              placeholder="สตูดิโอออกแบบ"
              className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
          <Field id="tagline_en" label="Tagline (English)">
            <Input
              id="tagline_en"
              value={settings.tagline_en}
              onChange={(e) => handleChange('tagline_en', e.target.value)}
              placeholder="Design Studio"
              className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
          <Field id="phone" label="Phone">
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+66 81 234 5678"
              className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
        </div>

        <Separator className="my-5 bg-[#E5E4E2]" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="address_th" label="Address (Thai)">
            <Textarea
              id="address_th"
              value={settings.address_th}
              onChange={(e) => handleChange('address_th', e.target.value)}
              placeholder="123 ถนนสุขุมวิท กรุงเทพ 10110"
              rows={3}
              className="resize-none border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
          <Field id="address_en" label="Address (English)">
            <Textarea
              id="address_en"
              value={settings.address_en}
              onChange={(e) => handleChange('address_en', e.target.value)}
              placeholder="123 Sukhumvit Road, Bangkok 10110"
              rows={3}
              className="resize-none border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
        </div>
      </div>

      {/* Social Links */}
      <div className="rounded-lg border border-[#E5E4E2] bg-white p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-[#1A1A1A]">Social Links</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="instagram_url" label="Instagram URL">
            <Input
              id="instagram_url"
              value={settings.instagram_url}
              onChange={(e) => handleChange('instagram_url', e.target.value)}
              placeholder="https://www.instagram.com/twodesk.studio"
              className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
          <Field id="facebook_url" label="Facebook URL">
            <Input
              id="facebook_url"
              value={settings.facebook_url}
              onChange={(e) => handleChange('facebook_url', e.target.value)}
              placeholder="https://www.facebook.com/twodesk.studio"
              className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
          </Field>
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-lg border border-[#E5E4E2] bg-white p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-[#1A1A1A]">SEO</h2>
        <div className="flex flex-col gap-4">
          <Field id="seo_title" label="Default Meta Title">
            <Input
              id="seo_title"
              value={settings.seo_title}
              onChange={(e) => handleChange('seo_title', e.target.value)}
              placeholder="TWO DESKS — Design Studio"
              className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
            <p className="text-[11px] text-[#999]">
              Recommended: 50–60 characters ({settings.seo_title.length}/60)
            </p>
          </Field>
          <Field id="seo_description" label="Default Meta Description">
            <Textarea
              id="seo_description"
              value={settings.seo_description}
              onChange={(e) => handleChange('seo_description', e.target.value)}
              placeholder="TWO DESKS is a design studio specializing in interior, architecture, and furniture design."
              rows={3}
              className="resize-none border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
            />
            <p className="text-[11px] text-[#999]">
              Recommended: 150–160 characters ({settings.seo_description.length}/160)
            </p>
          </Field>
        </div>
      </div>

      {/* Save (bottom) */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white hover:bg-black"
        >
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
