'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ContactSettings {
  address_en: string;
  address_th: string;
  phone: string;
  email: string;
  map_url: string;
}

const defaultSettings: ContactSettings = {
  address_en: '',
  address_th: '',
  phone: '',
  email: '',
  map_url: '',
};

export default function ContactPageEditor() {
  const [form, setForm] = useState<ContactSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setForm({
          address_en: data.address_en ?? '',
          address_th: data.address_th ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          map_url: data.map_url ?? '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const update = (field: keyof ContactSettings, value: string) => {
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
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">Contact Page</h1>
          <p className="text-[13px] text-[#999]">Edit contact information</p>
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
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">Contact Page</h1>
          <p className="text-[13px] text-[#999]">Edit contact information</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <span className="text-[15px] font-bold text-[#1A1A1A]">Contact Information</span>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Phone</Label>
            <Input
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="+66 XX XXX XXXX"
              type="tel"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Email</Label>
            <Input
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="hello@twodesk.studio"
              type="email"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <span className="text-[15px] font-bold text-[#1A1A1A]">Address</span>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Address (English)</Label>
            <Textarea
              value={form.address_en}
              onChange={e => update('address_en', e.target.value)}
              placeholder="Studio address in English..."
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Address (ภาษาไทย)</Label>
            <Textarea
              value={form.address_th}
              onChange={e => update('address_th', e.target.value)}
              placeholder="ที่อยู่สตูดิโอภาษาไทย..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <span className="text-[15px] font-bold text-[#1A1A1A]">Google Maps</span>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Embed URL</Label>
            <Input
              value={form.map_url}
              onChange={e => update('map_url', e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-[11px] text-[#999]">
              ใส่ URL จาก Google Maps &gt; Share &gt; Embed a map &gt; copy src="..."
            </p>
          </div>

          {form.map_url && (
            <div className="overflow-hidden rounded-lg border border-[#E5E4E2]">
              <iframe
                src={form.map_url}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Studio location"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
