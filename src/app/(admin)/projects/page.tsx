'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Project {
  id: string;
  title_en: string;
  title_th: string;
  slug: string;
  category: string;
  location_en: string;
  area_sqm: number | null;
  year: string;
  status: string;
}

const CATEGORIES = [
  { key: 'all', label: 'All', color: '' },
  { key: 'commercial', label: 'Commercial', color: 'text-[#C0392B] border-[#C0392B]/20 bg-[#C0392B]/5' },
  { key: 'cafe', label: 'Cafe / Bar', color: 'text-[#2471A3] border-[#2471A3]/20 bg-[#2471A3]/5' },
  { key: 'residential', label: 'Residential', color: 'text-[#1ABC9C] border-[#1ABC9C]/20 bg-[#1ABC9C]/5' },
  { key: 'others', label: 'Others', color: 'text-[#F1C40F] border-[#F1C40F]/30 bg-[#F1C40F]/5' },
];

const categoryBadgeColors: Record<string, string> = {
  commercial: 'text-[#C0392B] bg-[#C0392B]/8',
  cafe: 'text-[#2471A3] bg-[#2471A3]/8',
  residential: 'text-[#1ABC9C] bg-[#1ABC9C]/8',
  others: 'text-[#F1C40F] bg-[#F1C40F]/8',
};

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      category,
      search,
    });
    const res = await fetch(`/api/admin/projects?${params}`);
    const data = await res.json();
    setProjects(data.projects ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, category, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/projects/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchProjects();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Projects</h1>
          <p className="text-[13px] text-[#999]">Manage your portfolio projects</p>
        </div>
        <Link href="/admin/projects/new">
          <Button>+ New Project</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-[300px]"
        />
        <div className="flex gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setPage(1); }}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                category === cat.key
                  ? cat.key === 'all'
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                    : cat.color
                  : 'border-[#E5E4E2] bg-white text-[#999] hover:border-[#999]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex border-b border-[#E5E4E2] bg-[#FAFAF8] px-5 py-3">
            <span className="w-[240px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Project</span>
            <span className="w-[120px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Category</span>
            <span className="w-[140px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Location</span>
            <span className="w-[70px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Area</span>
            <span className="w-[60px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Year</span>
            <span className="w-[80px] text-[10px] uppercase tracking-[0.1em] text-[#999]">Status</span>
            <span className="flex-1 text-[10px] uppercase tracking-[0.1em] text-[#999]">Actions</span>
          </div>
          {/* Rows */}
          {loading ? (
            <div className="py-12 text-center text-[13px] text-[#999]">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#999]">No projects found</div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center border-b border-[#F0EFED] px-5 py-3.5 transition-colors hover:bg-[#FAFAF8]"
              >
                <span className="w-[240px] text-[13px] font-bold text-[#1A1A1A]">
                  {project.title_en}
                </span>
                <span className="w-[120px]">
                  <Badge variant="secondary" className={`text-[10px] ${categoryBadgeColors[project.category] ?? ''}`}>
                    {project.category}
                  </Badge>
                </span>
                <span className="w-[140px] text-[12px] text-[#6B6B6B]">
                  {project.location_en || '—'}
                </span>
                <span className="w-[70px] text-[12px] text-[#6B6B6B]">
                  {project.area_sqm || '—'}
                </span>
                <span className="w-[60px] text-[12px] text-[#6B6B6B]">{project.year}</span>
                <span className="w-[80px]">
                  <Badge
                    variant="secondary"
                    className={
                      project.status === 'published'
                        ? 'text-[10px]'
                        : 'bg-[#F1C40F]/8 text-[10px] text-[#F1C40F]'
                    }
                  >
                    {project.status}
                  </Badge>
                </span>
                <div className="flex flex-1 gap-2">
                  <Link href={`/admin/projects/${project.id}`} className="text-[11px] text-[#2471A3] hover:underline">
                    Edit
                  </Link>
                  <span className="text-[11px] text-[#999]">·</span>
                  <button
                    onClick={() => setDeleteId(project.id)}
                    className="text-[11px] text-[#C0392B] hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#999]">
          Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} projects
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
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
