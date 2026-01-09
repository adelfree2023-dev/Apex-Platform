"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, MapPin, CreditCard, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import type { ShippingData, PaymentData } from "./checkout-content";
import { getActiveCustomer, type ActiveCustomer } from "@/lib/vendure-checkout";

// Egyptian Governorates
const GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
    'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'أسوان',
    'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
    'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
    'شمال سيناء', 'سوهاج'
];

// Payment Methods
const PAYMENT_METHODS = [
    { id: "cod", name: "الدفع عند الاستلام", icon: "💵", desc: "نقداً للمندوب", enabled: true },
    { id: "card", name: "بطاقة ائتمان", icon: "💳", desc: "Visa, Mastercard", enabled: false },
    { id: "instapay", name: "InstaPay", icon: "📱", desc: "تحويل فوري", enabled: false },
    { id: "vodafone", name: "فودافون كاش", icon: "🔴", desc: "محفظة إلكترونية", enabled: false },
    { id: "fawry", name: "فوري", icon: "🟡", desc: "أي فرع فوري", enabled: false },
];

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
    const [paymentOpen, setPaymentOpen] = useState(false);

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
            () => {
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
            newErrors.phone = "رقم هاتف غير صحيح";
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

        const paymentData: PaymentData = { method: formData.paymentMethod };
        onSubmit(shippingData, paymentData);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const selectedPayment = PAYMENT_METHODS.find(m => m.id === formData.paymentMethod) || PAYMENT_METHODS[0];
    const subtotal = cartTotal;
    const total = subtotal;

    return (
        <form onSubmit={handleSubmit} dir="rtl" className="max-w-7xl mx-auto px-4">
            {/* 12-Column Grid: Form (8 cols) | Summary (4 cols) */}
            <div className="grid grid-cols-12 gap-8 items-start">

                {/* MAIN COLUMN: Form Container (col-span-8) */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Header with Breadcrumb */}
                    <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h1 className="text-lg font-bold text-gray-900">إتمام الطلب</h1>
                        <Link
                            href={`/${tenantSlug}/cart`}
                            className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            ← العودة للسلة
                        </Link>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Section 1: Contact & Address */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                                <h2 className="font-semibold text-gray-900">معلومات التوصيل</h2>
                            </div>

                            {/* Name & Phone */}
                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label className="text-sm text-gray-600 mb-1.5 block">الاسم بالكامل *</Label>
                                    <Input
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="محمد أحمد"
                                        className={`h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white ${errors.fullName ? "border-red-400" : ""}`}
                                    />
                                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600 mb-1.5 block">رقم الهاتف *</Label>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="01xxxxxxxxx"
                                        className={`h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white ${errors.phone ? "border-red-400" : ""}`}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            {/* Auto Location */}
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                disabled={locationLoading}
                                className="w-full h-10 mb-4 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary hover:text-primary flex items-center justify-center gap-2 transition-all"
                            >
                                {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                تحديد موقعي تلقائياً
                            </button>

                            {/* Governorate & City */}
                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label className="text-sm text-gray-600 mb-1.5 block">المحافظة *</Label>
                                    <select
                                        name="governorate"
                                        value={formData.governorate}
                                        onChange={handleChange}
                                        className={`w-full h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm appearance-none cursor-pointer ${errors.governorate ? "border-red-400" : ""}`}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', backgroundSize: '16px' }}
                                    >
                                        <option value="">اختر المحافظة</option>
                                        {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                                    </select>
                                    {errors.governorate && <p className="text-xs text-red-500 mt-1">{errors.governorate}</p>}
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600 mb-1.5 block">المدينة / المنطقة</Label>
                                    <Input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="مدينة نصر"
                                        className="h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white"
                                    />
                                </div>
                            </div>

                            {/* Street */}
                            <div className="mb-4">
                                <Label className="text-sm text-gray-600 mb-1.5 block">الشارع *</Label>
                                <Input
                                    name="street"
                                    value={formData.street}
                                    onChange={handleChange}
                                    placeholder="شارع التحرير"
                                    className={`h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white ${errors.street ? "border-red-400" : ""}`}
                                />
                                {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
                            </div>

                            {/* Building Details */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div>
                                    <Label className="text-sm text-gray-600 mb-1.5 block">رقم العمارة</Label>
                                    <Input name="building" value={formData.building} onChange={handleChange} placeholder="12" className="h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-center" />
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600 mb-1.5 block">الدور</Label>
                                    <Input name="floor" value={formData.floor} onChange={handleChange} placeholder="3" className="h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-center" />
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600 mb-1.5 block">الشقة</Label>
                                    <Input name="apartment" value={formData.apartment} onChange={handleChange} placeholder="5" className="h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-center" />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <Label className="text-sm text-gray-600 mb-1.5 block">ملاحظات (اختياري)</Label>
                                <Textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="مثال: أمام البوابة الخلفية..."
                                    rows={2}
                                    className="rounded-lg bg-gray-50 border-gray-200 focus:bg-white resize-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* Section 2: Payment */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                                <h2 className="font-semibold text-gray-900">طريقة الدفع</h2>
                            </div>

                            {/* Payment Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setPaymentOpen(!paymentOpen)}
                                    className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white flex items-center justify-between transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{selectedPayment.icon}</span>
                                        <span className="font-medium text-sm">{selectedPayment.name}</span>
                                        <span className="text-xs text-gray-400">{selectedPayment.desc}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${paymentOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {paymentOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl z-50 overflow-hidden">
                                        {PAYMENT_METHODS.map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                disabled={!method.enabled}
                                                onClick={() => {
                                                    if (method.enabled) {
                                                        setFormData(prev => ({ ...prev, paymentMethod: method.id as "cod" | "card" }));
                                                        setPaymentOpen(false);
                                                    }
                                                }}
                                                className={`w-full px-4 py-3 flex items-center gap-3 text-right text-sm ${method.enabled ? 'hover:bg-gray-50' : 'opacity-40 cursor-not-allowed'
                                                    } ${formData.paymentMethod === method.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <span className="text-lg">{method.icon}</span>
                                                <span className="flex-1 font-medium">{method.name}</span>
                                                {!method.enabled && <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">قريباً</span>}
                                                {formData.paymentMethod === method.id && <Check className="w-4 h-4 text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR: Sticky Order Summary (col-span-4) */}
                <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-5">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">ملخص الطلب</h2>
                        </div>

                        <div className="p-5">
                            {/* Cart Items */}
                            {cartItems.length > 0 && (
                                <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                                    {cartItems.slice(0, 3).map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.name}</p>
                                                <p className="text-xs text-gray-400">×{item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-medium">{(item.price / 100).toFixed(0)} ج.م</p>
                                        </div>
                                    ))}
                                    {cartItems.length > 3 && (
                                        <p className="text-xs text-gray-400 text-center">+{cartItems.length - 3} منتجات أخرى</p>
                                    )}
                                </div>
                            )}

                            {/* Totals */}
                            <div className="space-y-2 mb-5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">المجموع</span>
                                    <span>{(subtotal / 100).toFixed(2)} ج.م</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">الشحن</span>
                                    <span className="text-green-600">مجاني</span>
                                </div>
                                <div className="h-px bg-gray-100 my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>الإجمالي</span>
                                    <span className="text-primary">{(total / 100).toFixed(2)} ج.م</span>
                                </div>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full h-12 rounded-xl font-bold text-base"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="h-5 w-5 animate-spin ml-2" />جاري التأكيد...</>
                                ) : (
                                    <>تأكيد الطلب<ArrowRight className="h-5 w-5 mr-2" /></>
                                )}
                            </Button>

                            {/* Trust */}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center gap-4 text-[11px] text-gray-400">
                                <span>🔒 آمن</span>
                                <span>📦 سريع</span>
                                <span>↩️ إرجاع</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
