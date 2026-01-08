"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Loader2, MapPin, CreditCard, Truck, ShoppingBag, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ShippingData, PaymentData } from "./checkout-content";
import {
    getActiveCustomer,
    type ActiveCustomer,
} from "@/lib/vendure-checkout";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Egyptian Governorates
const GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
    'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'أسوان',
    'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
    'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
    'شمال سيناء', 'سوهاج'
];

// Payment Methods Configuration
const PAYMENT_METHODS = [
    { id: "cod", name: "الدفع عند الاستلام", icon: "💵", description: "ادفع نقداً عند الاستلام", enabled: true },
    { id: "card", name: "بطاقة ائتمان", icon: "💳", description: "Visa, Mastercard", enabled: false, badge: "قريباً" },
    { id: "instapay", name: "InstaPay", icon: "📱", description: "التحويل الفوري", enabled: false, badge: "قريباً" },
    { id: "vodafone", name: "فودافون كاش", icon: "🔴", description: "محفظة فودافون", enabled: false, badge: "قريباً" },
    { id: "fawry", name: "فوري", icon: "🟡", description: "ادفع في أي فرع فوري", enabled: false, badge: "قريباً" },
    { id: "valu", name: "ValU تقسيط", icon: "🔵", description: "قسّط على 12 شهر", enabled: false, badge: "قريباً" },
];

// Payment Method Selector Component
function PaymentMethodSelector({
    selectedMethod,
    onSelect
}: {
    selectedMethod: string;
    onSelect: (method: "cod" | "card") => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = PAYMENT_METHODS.find(m => m.id === selectedMethod) || PAYMENT_METHODS[0];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">طريقة الدفع</h2>
            </div>

            {/* Custom Dropdown */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full h-14 px-4 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-between hover:border-primary/50 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{selected.icon}</span>
                        <div className="text-right">
                            <p className="font-medium">{selected.name}</p>
                            <p className="text-xs text-gray-500">{selected.description}</p>
                        </div>
                    </div>
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    disabled={!method.enabled}
                                    onClick={() => {
                                        if (method.enabled) {
                                            onSelect(method.id as "cod" | "card");
                                            setIsOpen(false);
                                        }
                                    }}
                                    className={`w-full px-4 py-3 flex items-center gap-3 text-right transition-colors ${method.enabled
                                            ? 'hover:bg-gray-50 cursor-pointer'
                                            : 'opacity-50 cursor-not-allowed bg-gray-50'
                                        } ${selectedMethod === method.id ? 'bg-primary/5 border-r-4 border-primary' : ''}`}
                                >
                                    <span className="text-2xl">{method.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{method.name}</p>
                                            {method.badge && (
                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                                    {method.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{method.description}</p>
                                    </div>
                                    {selectedMethod === method.id && (
                                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface CartItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
}

interface QuickCheckoutFormProps {
    onSubmit: (shippingData: ShippingData, paymentData: PaymentData) => void;
    isProcessing: boolean;
    tenantSlug: string;
    channelToken: string;
    cartTotal: number;
    cartItems?: CartItem[];
}

interface FormData {
    fullName: string;
    phone: string;
    governorate: string;
    city: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
    notes: string;
    email: string;
    paymentMethod: "cod" | "card";
}

export function QuickCheckoutForm({
    onSubmit,
    isProcessing,
    tenantSlug,
    channelToken,
    cartTotal,
    cartItems = []
}: QuickCheckoutFormProps) {
    const [customer, setCustomer] = useState<ActiveCustomer | null>(null);
    const [loading, setLoading] = useState(true);
    const [locationLoading, setLocationLoading] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        phone: "",
        governorate: "",
        city: "",
        street: "",
        building: "",
        floor: "",
        apartment: "",
        notes: "",
        email: "",
        paymentMethod: "cod",
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});

    // Fetch customer data
    useEffect(() => {
        async function fetchCustomer() {
            setLoading(true);
            try {
                const activeCustomer = await getActiveCustomer(channelToken);
                setCustomer(activeCustomer);

                if (activeCustomer) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: `${activeCustomer.firstName} ${activeCustomer.lastName}`.trim(),
                        email: activeCustomer.emailAddress,
                        phone: activeCustomer.phoneNumber || "",
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch customer:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCustomer();
    }, [channelToken]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // Auto-detect location
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("المتصفح لا يدعم تحديد الموقع");
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
                    );
                    const data = await response.json();

                    if (data.address) {
                        setFormData(prev => ({
                            ...prev,
                            governorate: data.address.state || data.address.governorate || "",
                            city: data.address.city || data.address.town || data.address.village || "",
                            street: data.address.road || "",
                        }));
                    }
                } catch (error) {
                    console.error("Failed to get location:", error);
                } finally {
                    setLocationLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setLocationLoading(false);
                alert("تعذر تحديد الموقع");
            }
        );
    };

    const validate = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.fullName.trim()) newErrors.fullName = "الاسم مطلوب";
        if (!formData.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
        else if (!/^(01)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ""))) {
            newErrors.phone = "رقم هاتف غير صحيح (01xxxxxxxxx)";
        }
        if (!formData.governorate.trim()) newErrors.governorate = "المحافظة مطلوبة";
        if (!formData.street.trim()) newErrors.street = "الشارع مطلوب";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const addressParts = [
            formData.street,
            formData.building && `عمارة ${formData.building}`,
            formData.floor && `الدور ${formData.floor}`,
            formData.apartment && `شقة ${formData.apartment}`,
        ].filter(Boolean);

        const shippingData: ShippingData = {
            fullName: formData.fullName,
            email: formData.email || `${formData.phone}@guest.local`,
            phone: formData.phone,
            address: addressParts.join(", "),
            city: formData.city || formData.governorate,
            postalCode: "00000",
            country: "مصر",
        };

        const paymentData: PaymentData = {
            method: formData.paymentMethod,
        };

        onSubmit(shippingData, paymentData);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Calculate totals
    const subtotal = cartTotal;
    const shipping = 0; // Free shipping
    const total = subtotal + shipping;

    return (
        <form onSubmit={handleSubmit} dir="rtl">
            {/* Breadcrumb Navigation */}
            <div className="mb-6">
                <Link
                    href={`/${tenantSlug}/cart`}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 ml-1" />
                    العودة للسلة
                </Link>
            </div>

            {/* Two-Column Layout */}
            <div className="grid lg:grid-cols-[1fr,380px] gap-8">
                {/* Left Column - Forms (60-70%) */}
                <div className="space-y-6">
                    {/* Delivery Information */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold">معلومات التوصيل</h2>
                        </div>

                        {/* Name & Phone */}
                        <div className="grid sm:grid-cols-2 gap-5 mb-5">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">الاسم بالكامل *</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="محمد أحمد"
                                    className={`h-12 rounded-xl ${errors.fullName ? "border-red-500" : ""}`}
                                />
                                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">رقم الهاتف *</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="01xxxxxxxxx"
                                    className={`h-12 rounded-xl ${errors.phone ? "border-red-500" : ""}`}
                                />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                            </div>
                        </div>

                        {/* Location Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGetLocation}
                            disabled={locationLoading}
                            className="w-full h-12 rounded-xl mb-5 border-dashed"
                        >
                            {locationLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            ) : (
                                <MapPin className="h-4 w-4 ml-2" />
                            )}
                            تحديد موقعي تلقائياً
                        </Button>

                        {/* Governorate & City */}
                        <div className="grid sm:grid-cols-2 gap-5 mb-5">
                            <div className="space-y-2">
                                <Label htmlFor="governorate">المحافظة *</Label>
                                <select
                                    id="governorate"
                                    name="governorate"
                                    value={formData.governorate}
                                    onChange={handleChange}
                                    className={`w-full h-12 px-4 rounded-xl border ${errors.governorate ? "border-red-500" : "border-gray-200"} bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                                >
                                    <option value="">اختر المحافظة</option>
                                    {GOVERNORATES.map(gov => (
                                        <option key={gov} value={gov}>{gov}</option>
                                    ))}
                                </select>
                                {errors.governorate && <p className="text-sm text-red-500">{errors.governorate}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">المدينة / المنطقة</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="مدينة نصر"
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Street */}
                        <div className="space-y-2 mb-5">
                            <Label htmlFor="street">الشارع *</Label>
                            <Input
                                id="street"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                placeholder="شارع التحرير"
                                className={`h-12 rounded-xl ${errors.street ? "border-red-500" : ""}`}
                            />
                            {errors.street && <p className="text-sm text-red-500">{errors.street}</p>}
                        </div>

                        {/* Building Details - With Better Spacing */}
                        <div className="grid grid-cols-3 gap-4 mb-5">
                            <div className="space-y-2">
                                <Label htmlFor="building">رقم العمارة</Label>
                                <Input
                                    id="building"
                                    name="building"
                                    value={formData.building}
                                    onChange={handleChange}
                                    placeholder="12"
                                    className="h-12 rounded-xl text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="floor">الدور</Label>
                                <Input
                                    id="floor"
                                    name="floor"
                                    value={formData.floor}
                                    onChange={handleChange}
                                    placeholder="3"
                                    className="h-12 rounded-xl text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apartment">الشقة</Label>
                                <Input
                                    id="apartment"
                                    name="apartment"
                                    value={formData.apartment}
                                    onChange={handleChange}
                                    placeholder="5"
                                    className="h-12 rounded-xl text-center"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">ملاحظات للمندوب (اختياري)</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="مثال: أمام البوابة الخلفية، الاتصال قبل الوصول..."
                                rows={3}
                                className="rounded-xl resize-none"
                            />
                        </div>
                    </div>

                    {/* Payment Methods - Compact Dropdown */}
                    <PaymentMethodSelector
                        selectedMethod={formData.paymentMethod}
                        onSelect={(method) => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                    />
                </div>

                {/* Right Column - Order Summary (30-40%, Sticky) */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold">ملخص الطلب</h2>
                        </div>

                        {/* Cart Items (if provided) */}
                        {cartItems.length > 0 && (
                            <div className="space-y-3 mb-6 pb-6 border-b">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                "صورة"
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-medium">{(item.price / 100).toFixed(2)} ج.م</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Totals */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">المجموع الفرعي</span>
                                <span>{(subtotal / 100).toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">الشحن</span>
                                <span className="text-green-600 font-medium">مجاني</span>
                            </div>
                            <div className="h-px bg-gray-200 my-3"></div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>الإجمالي</span>
                                <span className="text-primary">{(total / 100).toFixed(2)} ج.م</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 transition-all"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                    جاري تأكيد الطلب...
                                </>
                            ) : (
                                <>
                                    تأكيد الطلب
                                    <ArrowRight className="h-5 w-5 mr-2" />
                                </>
                            )}
                        </Button>

                        {/* Trust Badges */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                                <span>🔒 دفع آمن</span>
                                <span>•</span>
                                <span>📦 توصيل سريع</span>
                                <span>•</span>
                                <span>↩️ إرجاع سهل</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
