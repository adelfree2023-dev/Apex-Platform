import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TopNavProps {
    title: string;
    searchPlaceholder: string;
    onSearch: (query: string) => void;
    rightActions?: React.ReactNode;
}

export default function TopNav({
    title,
    searchPlaceholder,
    onSearch,
    rightActions,
}: TopNavProps) {
    const router = useRouter();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            onSearch(query);
        }
    };

    return (
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <div className="relative">
                    <Input
                        placeholder={searchPlaceholder}
                        onChange={handleSearch}
                        className="w-64"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
                {rightActions}
                <Button variant="ghost" size="icon" onClick={() => router.push('/account')}>
                    <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder-user.jpg" alt="User" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => router.push('/cart')}>
                    <ShoppingCartIcon className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
