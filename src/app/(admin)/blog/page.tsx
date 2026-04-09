'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Article {
  id: string;
  title_en: string;
  title_th: string;
  slug: string;
  category: string;
  status: string;
  published_at: string | null;
}

const CATEGORIES = ['all', 'Design Trends', 'Behind the Scenes', 'Tips', 'Studio Life'];

export default function BlogListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', category, search });
    const res = await fetch(`/api/admin/articles?${params}`);
    const data = await res.json();
    setArticles(data.articles ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, category, search]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/articles/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchArticles();
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Blog Articles</h1>
          <p className="text-[13px] text-[#999]">Manage your blog content</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>+ New Article</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-[300px]"
        />
        <div className="flex gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                category === cat
                  ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                  : 'border-[#E5E4E2] bg-white text-[#999] hover:border-[#999]'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex border-b border-[#E5E4E2] bg-[#FAFAF8] px-5 py-3">
            <span className="w-[320px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Article</span>
            <span className="w-[150px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Category</span>
            <span className="w-[100px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Date</span>
            <span className="w-[80px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Status</span>
            <span className="flex-1 text-[10px] uppercase tracking-[0.1em] text-[#999]">Actions</span>
          </div>
          {loading ? (
            <div className="py-12 text-center text-[13px] text-[#999]">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#999]">No articles found</div>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="flex items-center border-b border-[#F0EFED] px-5 py-3.5 transition-colors hover:bg-[#FAFAF8]">
                <span className="w-[320px] text-[13px] font-bold text-[#1A1A1A]">{article.title_en}</span>
                <span className="w-[150px] text-[11px] text-[#6B6B6B]">{article.category}</span>
                <span className="w-[100px] text-[12px] text-[#6B6B6B]">{formatDate(article.published_at)}</span>
                <span className="w-[80px]">
                  <Badge variant="secondary" className={article.status === 'published' ? 'text-[10px]' : 'bg-[#F1C40F]/8 text-[10px] text-[#F1C40F]'}>
                    {article.status}
                  </Badge>
                </span>
                <div className="flex flex-1 gap-2">
                  <Link href={`/admin/blog/${article.id}`} className="text-[11px] text-[#2471A3] hover:underline">Edit</Link>
                  <span className="text-[11px] text-[#999]">·</span>
                  <button onClick={() => setDeleteId(article.id)} className="text-[11px] text-[#C0392B] hover:underline">Delete</button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#999]">Showing {Math.min((page-1)*10+1, total)}-{Math.min(page*10, total)} of {total} articles</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(page-1)}>← Prev</Button>
          {Array.from({ length: totalPages }, (_, i) => i+1).map((p) => (
            <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={() => setPage(page+1)}>Next →</Button>
        </div>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
