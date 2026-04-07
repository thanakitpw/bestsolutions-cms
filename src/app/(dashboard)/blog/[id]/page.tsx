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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface ArticleData {
  title_th: string; title_en: string; slug: string; category: string;
  excerpt_th: string; excerpt_en: string;
  content_en: JSONContent | null; content_th: JSONContent | null;
  cover_image: string; seo_title: string; seo_description: string;
  seo_keywords: string[]; status: string; published_at: string;
}

const empty: ArticleData = {
  title_th: '', title_en: '', slug: '', category: 'Tips',
  excerpt_th: '', excerpt_en: '',
  content_en: null, content_th: null,
  cover_image: '',
  seo_title: '', seo_description: '', seo_keywords: [],
  status: 'draft', published_at: '',
};

export default function BlogEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState<ArticleData>(empty);
  const [lang, setLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [kwInput, setKwInput] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/articles/${id}`).then(r => r.json()).then(data => {
        setForm({
          title_th: data.title_th ?? '', title_en: data.title_en ?? '',
          slug: data.slug ?? '', category: data.category ?? 'Tips',
          excerpt_th: data.excerpt_th ?? '', excerpt_en: data.excerpt_en ?? '',
          content_en: data.content_en ?? null, content_th: data.content_th ?? null,
          cover_image: data.cover_image ?? '',
          seo_title: data.seo_title ?? '', seo_description: data.seo_description ?? '',
          seo_keywords: data.seo_keywords ?? [], status: data.status ?? 'draft',
          published_at: data.published_at ? data.published_at.split('T')[0] : '',
        });
      });
    }
  }, [id, isNew]);

  const update = (f: keyof ArticleData, v: string | string[] | JSONContent | null) =>
    setForm(p => ({ ...p, [f]: v }));

  const genSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSave = async (status?: string) => {
    setSaving(true);
    const payload = {
      ...form,
      status: status ?? form.status,
      published_at: form.published_at || (status === 'published' ? new Date().toISOString() : null),
    };
    const url = isNew ? '/api/admin/articles' : `/api/admin/articles/${id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) router.push('/admin/blog');
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px]">
          <button onClick={() => router.push('/admin/blog')} className="text-[#999] hover:text-[#1A1A1A]">Blog</button>
          <span className="text-[#999]">/</span>
          <span className="font-bold text-[#1A1A1A]">{isNew ? 'New Article' : form.title_en || 'Edit'}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>Save Draft</Button>
          <Button onClick={() => handleSave('published')} disabled={saving}>{saving ? 'Saving...' : 'Publish'}</Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex flex-1 flex-col gap-5">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <span className="text-[15px] font-bold text-[#1A1A1A]">Article Details</span>

              <Tabs value={lang} onValueChange={setLang}>
                <TabsList>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="th">TH</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Title</Label>
                {lang === 'en' ? (
                  <Input value={form.title_en} onChange={e => { update('title_en', e.target.value); if (isNew) update('slug', genSlug(e.target.value)); }} placeholder="Article title" />
                ) : (
                  <Input value={form.title_th} onChange={e => update('title_th', e.target.value)} placeholder="หัวข้อบทความ" />
                )}
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">URL Slug</Label>
                <Input value={form.slug} onChange={e => update('slug', e.target.value)} className="bg-[#FAFAF8]" />
              </div>

              {/* Excerpt */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Excerpt</Label>
                {lang === 'en' ? (
                  <Textarea value={form.excerpt_en} onChange={e => update('excerpt_en', e.target.value)} placeholder="Short description" rows={3} />
                ) : (
                  <Textarea value={form.excerpt_th} onChange={e => update('excerpt_th', e.target.value)} placeholder="คำอธิบายสั้นๆ" rows={3} />
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
                    placeholder="Write article content in English..."
                  />
                ) : (
                  <RichTextEditor
                    key="content-th"
                    content={form.content_th ?? undefined}
                    onChange={(json) => update('content_th', json)}
                    placeholder="เขียนเนื้อหาบทความภาษาไทย..."
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
                <Input value={form.seo_title} onChange={e => update('seo_title', e.target.value)} placeholder="Page title for search engines" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Meta Description</Label>
                <Textarea value={form.seo_description} onChange={e => update('seo_description', e.target.value)} rows={2} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {form.seo_keywords.map(kw => (
                    <Badge key={kw} variant="secondary" className="gap-1 text-[11px]">
                      {kw}<button onClick={() => update('seo_keywords', form.seo_keywords.filter(k => k !== kw))} className="ml-1 text-[#999] hover:text-[#C0392B]">×</button>
                    </Badge>
                  ))}
                  <Input value={kwInput} onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (kwInput.trim()) { update('seo_keywords', [...form.seo_keywords, kwInput.trim()]); setKwInput(''); } } }}
                    placeholder="+ Add keyword" className="w-[140px] border-dashed text-[11px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex w-[300px] flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <span className="text-[13px] font-bold text-[#1A1A1A]">Status</span>
              <div className="flex gap-2">
                <Button variant={form.status === 'published' ? 'default' : 'outline'} size="sm" onClick={() => update('status', 'published')}>Published</Button>
                <Button variant={form.status === 'draft' ? 'default' : 'outline'} size="sm" onClick={() => update('status', 'draft')}>Draft</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <span className="text-[13px] font-bold text-[#1A1A1A]">Category</span>
              <Select value={form.category} onValueChange={v => v && update('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Design Trends">Design Trends</SelectItem>
                  <SelectItem value="Behind the Scenes">Behind the Scenes</SelectItem>
                  <SelectItem value="Tips">Tips</SelectItem>
                  <SelectItem value="Studio Life">Studio Life</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <span className="text-[13px] font-bold text-[#1A1A1A]">Published Date</span>
              <Input type="date" value={form.published_at} onChange={e => update('published_at', e.target.value)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <span className="text-[13px] font-bold text-[#1A1A1A]">Cover Image</span>
              {form.cover_image ? (
                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#F0EFED]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.cover_image} alt="Cover" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-[#F0EFED]"><span className="text-[12px] text-[#999]">No cover image</span></div>
              )}
              <Input value={form.cover_image} onChange={e => update('cover_image', e.target.value)} placeholder="Image URL" className="text-[12px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
