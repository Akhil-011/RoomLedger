import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from './Header';
// ThemeToggle intentionally not imported into sidebar layout
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />

      <div className="container mx-auto px-4 py-8 flex justify-center">
        <main>{children}</main>
      </div>
    </div>
  );
}

export default Layout;
