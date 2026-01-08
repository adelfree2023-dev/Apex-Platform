'use client';
<<<<<<< HEAD
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    router.push(isAuth === 'true' ? '/dashboard' : '/login');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Loading Admin HQ...</span>
=======

import {useEffect} from 'react';
      import {useRouter} from 'next/navigation';
      import {Loader2} from 'lucide-react';

      export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if authenticated
    const isAuth = localStorage.getItem('isAuthenticated');

      if (isAuth === 'true') {
        router.push('/dashboard');
    } else {
        router.push('/login');
    }
  }, [router]);

      return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
>>>>>>> 45857ecc61ff7b2adee223bfff95bf16b545aad7
      </div>
      );
}
