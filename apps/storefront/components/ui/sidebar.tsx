import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface SidebarItem {
    label: string;
    icon: React.ReactNode;
    href: string;
    children?: SidebarItem[];
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: SidebarItem[];
}

export default function Sidebar({ isOpen, onClose, title, items }: SidebarProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleItem = (label: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(label)) {
            newExpanded.delete(label);
        } else {
            newExpanded.add(label);
        }
        setExpandedItems(newExpanded);
    };

    return (
        <div
            className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
        >
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {items.map((item) => (
                        <div key={item.label} className="mb-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                                onClick={() => item.children ? toggleItem(item.label) : null}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                                {item.children && (
                                    <span className="ml-auto">
                                        {expandedItems.has(item.label) ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </span>
                                )}
                            </Button>

                            {item.children && expandedItems.has(item.label) && (
                                <div className="ml-6 mt-1 space-y-1">
                                    {item.children.map((child) => (
                                        <Button
                                            key={child.label}
                                            variant="ghost"
                                            className="w-full justify-start px-3 py-1 text-xs rounded-md hover:bg-gray-100"
                                            asChild
                                        >
                                            <a href={child.href}>
                                                <span className="mr-2">{child.icon}</span>
                                                {child.label}
                                            </a>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="w-full"
                    >
                        Close Sidebar
                    </Button>
                </div>
            </div>
        </div>
    );
}
