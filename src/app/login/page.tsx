'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#1A1A1A] p-[60px] lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <span className="text-sm font-bold text-[#1A1A1A]">TD</span>
          </div>
          <span className="text-xl font-bold tracking-[0.04em] text-white">
            TWO DESK
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-[40px] font-bold leading-[1.15] text-white">
            Manage your
            <br />
            studio with ease
          </h1>
          <p className="max-w-[400px] text-[15px] leading-[1.6] text-white/50">
            Your admin panel for managing projects, blog articles, and client
            messages — all in one place.
          </p>
        </div>

        <span className="text-xs text-white/25">
          &copy; 2025 Two Desk Studio. All rights reserved.
        </span>
      </div>

      {/* Right — Form */}
      <div className="flex w-full items-center justify-center bg-[#FAFAF8] px-8 lg:w-1/2">
        <form onSubmit={handleLogin} className="flex w-[360px] flex-col gap-7">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Welcome back</h2>
            <p className="text-sm text-[#999]">
              Sign in to your admin account
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="td.info@twodeskstudio.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                  Password
                </Label>
                <span className="text-[11px] text-[#6B6B6B]">
                  Forgot password?
                </span>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-[#C0392B]">{error}</p>
          )}

          <Button type="submit" className="w-full py-6" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-xs text-[#999]">
            Need help? Contact your developer
          </p>
        </form>
      </div>
    </div>
  );
}
