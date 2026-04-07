'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { type JSONContent } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface ProjectData {
  title_th: string;
  title_en: string;
  slug: string;
  category: string;
  location_th: string;
  location_en: string;
  area_sqm: string;
  year: string;
  description_th: string;
  description_en: string;
  content_en: JSONContent | null;
  content_th: JSONContent | null;
  cover_image: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  status: string;
}

const emptyProject: ProjectData = {
  title_th: '', title_en: '', slug: '', category: 'others',
  location_th: '', location_en: '', area_sqm: '', year: '',
  description_th: '', description_en: '',
  content_en: null, content_th: null,
  cover_image: '',
  seo_title: '', seo_description: '', seo_keywords: [], status: 'draft',
};

export default function ProjectEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState<ProjectData>(emptyProject);
  const [lang, setLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/projects/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setForm({
            title_th: data.title_th ?? '',
            title_en: data.title_en ?? '',
            slug: data.slug ?? '',
            category: data.category ?? 'others',
            location_th: data.location_th ?? '',
            location_en: data.location_en ?? '',
            area_sqm: data.area_sqm ? String(data.area_sqm) : '',
            year: data.year ?? '',
            description_th: data.description_th ?? '',
            description_en: data.description_en ?? '',
            content_en: data.content_en ?? null,
            content_th: data.content_th ?? null,
            cover_image: data.cover_image ?? '',
            seo_title: data.seo_title ?? '',
            seo_description: data.seo_description ?? '',
            seo_keywords: data.seo_keywords ?? [],
            status: data.status ?? 'draft',
          });
        });
    }
  }, [id, isNew]);

  const update = (field: keyof ProjectData, value: string | string[] | JSONContent | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    update('title_en', value);
    if (isNew || !form.slug) {
      update('slug', generateSlug(value));
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !form.seo_keywords.includes(keywordInput.trim())) {
      update('seo_keywords', [...form.seo_keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    update('seo_keywords', form.seo_keywords.filter((k) => k !== kw));
  };

  const handleSave = async (status?: string) => {
    setSaving(true);
    const payload = {
      ...form,
      area_sqm: form.area_sqm ? parseInt(form.area_sqm) : null,
      status: status ?? form.status,
    };

    const url = isNew ? '/api/admin/projects' : `/api/admin/projects/${id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/admin/projects');
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px]">
          <button onClick={() => router.push('/admin/projects')} className="text-[#999] hover:text-[#1A1A1A]">
            Projects
          </button>
          <span className="text-[#999]">/</span>
          <span className="font-bold text-[#1A1A1A]">{isNew ? 'New Project' : form.title_en || 'Edit'}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
            Save Draft
          </Button>
          <Button onClick={() => handleSave('published')} disabled={saving}>
            {saving ? 'Saving...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left — Main Form */}
        <div className="flex flex-1 flex-col gap-5">
          {/* Project Details */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <span className="text-[15px] font-bold text-[#1A1A1A]">Project Details</span>

              {/* Language Tabs */}
              <Tabs value={lang} onValueChange={setLang}>
                <TabsList>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="th">TH</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                  Project Title
                </Label>
                {lang === 'en' ? (
                  <Input
                    value={form.title_en}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Project name in English"
                  />
                ) : (
                  <Input
                    value={form.title_th}
                    onChange={(e) => update('title_th', e.target.value)}
                    placeholder="ชื่อโปรเจกต์ภาษาไทย"
                  />
                )}
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">URL Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => update('slug', e.target.value)}
                  className="bg-[#FAFAF8]"
                />
              </div>

              {/* Description / Excerpt */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Description</Label>
                {lang === 'en' ? (
                  <Textarea
                    value={form.description_en}
                    onChange={(e) => update('description_en', e.target.value)}
                    placeholder="Project description in English"
                    rows={3}
                  />
                ) : (
                  <Textarea
                    value={form.description_th}
                    onChange={(e) => update('description_th', e.target.value)}
                    placeholder="คำอธิบายโปรเจกต์ภาษาไทย"
                    rows={3}
                  />
                )}
              </div>

              {/* Content — RichTextEditor */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                  Content {lang === 'en' ? '(English)' : '(ภาษาไทย)'}
                </Label>
                {lang === 'en' ? (
                  <RichTextEditor
                    key="content-en"
                    content={form.content_en ?? undefined}
                    onChange={(json) => update('content_en', json)}
                    placeholder="Write project content in English..."
                  />
                ) : (
                  <RichTextEditor
                    key="content-th"
                    content={form.content_th ?? undefined}
                    onChange={(json) => update('content_th', json)}
                    placeholder="เขียนเนื้อหาโปรเจกต์ภาษาไทย..."
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <span className="text-[15px] font-bold text-[#1A1A1A]">SEO</span>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">SEO Title</Label>
                <Input
                  value={form.seo_title}
                  onChange={(e) => update('seo_title', e.target.value)}
                  placeholder="Page title for search engines"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Meta Description</Label>
                <Textarea
                  value={form.seo_description}
                  onChange={(e) => update('seo_description', e.target.value)}
                  placeholder="Short description for search results"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {form.seo_keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 text-[11px]">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="ml-1 text-[#999] hover:text-[#C0392B]">×</button>
                    </Badge>
                  ))}
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="+ Add keyword"
                    className="w-[140px] border-dashed text-[11px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Sidebar */}
        <div className="flex w-[300px] flex-col gap-4">
          {/* Status */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <span className="text-[13px] font-bold text-[#1A1A1A]">Status</span>
              <div className="flex gap-2">
                <Button
                  variant={form.status === 'published' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update('status', 'published')}
                >
                  Published
                </Button>
                <Button
                  variant={form.status === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update('status', 'draft')}
                >
                  Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <span className="text-[13px] font-bold text-[#1A1A1A]">Category</span>
              <Select value={form.category} onValueChange={(v) => v && update('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="cafe">Cafe / Bar</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <span className="text-[13px] font-bold text-[#1A1A1A]">Project Info</span>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Location</Label>
                {lang === 'en' ? (
                  <Input
                    value={form.location_en}
                    onChange={(e) => update('location_en', e.target.value)}
                    placeholder="Bangkok, Thailand"
                  />
                ) : (
                  <Input
                    value={form.location_th}
                    onChange={(e) => update('location_th', e.target.value)}
                    placeholder="กรุงเทพฯ, ประเทศไทย"
                  />
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Area (sq.m.)</Label>
                  <Input
                    type="number"
                    value={form.area_sqm}
                    onChange={(e) => update('area_sqm', e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Year</Label>
                  <Input
                    value={form.year}
                    onChange={(e) => update('year', e.target.value)}
                    placeholder="2025"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <span className="text-[13px] font-bold text-[#1A1A1A]">Cover Image</span>
              {form.cover_image ? (
                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#F0EFED]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.cover_image} alt="Cover" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-[#F0EFED]">
                  <span className="text-[12px] text-[#999]">No cover image</span>
                </div>
              )}
              <Input
                value={form.cover_image}
                onChange={(e) => update('cover_image', e.target.value)}
                placeholder="Image URL"
                className="text-[12px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
