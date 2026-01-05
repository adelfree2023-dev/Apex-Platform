'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    email: string;
    name: string;
    role: string;
}

export function useAuth() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        const isAuth = localStorage.getItem('isAuthenticated');
        const userData = localStorage.getItem('user');

        if (isAuth === 'true' && userData) {
            setUser(JSON.parse(userData));
        } else {
            // Not authenticated
            setUser(null);
        }

        setLoading(false);
    }, []);

    const login = (email: string, name: string) => {
        localStorage.setItem('isAuthenticated', 'true');
        const userData = { email, name, role: 'SUPERADMIN' };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    return {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };
}
