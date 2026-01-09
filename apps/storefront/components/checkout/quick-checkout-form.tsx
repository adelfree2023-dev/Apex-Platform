"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, MapPin, ChevronDown, Check } from "lucide-react";
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
    { id: "fawry", name: "فوري", icon: "🟡", desc: "ادفع في فرع فوري", enabled: false },
];

interface CartItem { id: string; name: string; quantity: number; price: number; image?: string; }

interface QuickCheckoutFormProps {
    onSubmit: (shippingData: ShippingData, paymentData: PaymentData) => void;
    isProcessing: boolean;
    tenantSlug: string;
    channelToken: string;
    cartTotal: number;
    cartItems?: CartItem[];
}

interface FormData {
    fullName: string; phone: string; governorate: string; city: string;
    street: string; building: string; floor: string; apartment: string;
    notes: string; email: string; paymentMethod: "cod" | "card";
}

export function QuickCheckoutForm({ onSubmit, isProcessing, tenantSlug, channelToken, cartTotal, cartItems = [] }: QuickCheckoutFormProps) {
    const [customer, setCustomer] = useState<ActiveCustomer | null>(null);
    const [loading, setLoading] = useState(true);
    const [locationLoading, setLocationLoading] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        fullName: "", phone: "", governorate: "", city: "", street: "",
        building: "", floor: "", apartment: "", notes: "", email: "", paymentMethod: "cod",
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
            } catch (error) { console.error("Failed to fetch customer:", error); }
            finally { setLoading(false); }
        }
        fetchCustomer();
    }, [channelToken]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormData]) setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) { alert("المتصفح لا يدعم تحديد الموقع"); return; }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
                    const data = await response.json();
                    if (data.address) {
                        setFormData(prev => ({
                            ...prev,
                            governorate: data.address.state || data.address.governorate || "",
                            city: data.address.city || data.address.town || data.address.village || "",
                            street: data.address.road || "",
                        }));
                    }
                } catch (error) { console.error("Failed to get location:", error); }
                finally { setLocationLoading(false); }
            },
            () => { setLocationLoading(false); alert("تعذر تحديد الموقع"); }
        );
    };

    const validate = (): boolean => {
        const newErrors: Partial<FormData> = {};
        if (!formData.fullName.trim()) newErrors.fullName = "الاسم مطلوب";
        if (!formData.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
        else if (!/^(01)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ""))) newErrors.phone = "رقم غير صحيح";
        if (!formData.governorate.trim()) newErrors.governorate = "المحافظة مطلوبة";
        if (!formData.street.trim()) newErrors.street = "الشارع مطلوب";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const addressParts = [formData.street, formData.building && `عمارة ${formData.building}`, formData.floor && `الدور ${formData.floor}`, formData.apartment && `شقة ${formData.apartment}`].filter(Boolean);
        const shippingData: ShippingData = { fullName: formData.fullName, email: formData.email || `${formData.phone}@guest.local`, phone: formData.phone, address: addressParts.join(", "), city: formData.city || formData.governorate, postalCode: "00000", country: "مصر" };
        const paymentData: PaymentData = { method: formData.paymentMethod };
        onSubmit(shippingData, paymentData);
    };

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const selectedPayment = PAYMENT_METHODS.find(m => m.id === formData.paymentMethod) || PAYMENT_METHODS[0];
    const total = cartTotal;

    return (
        <form onSubmit={handleSubmit} dir="rtl">
            {/* FULL WIDTH CONTAINER */}
            <div className="w-11/12 max-w-7xl mx-auto">

                {/* 12-COLUMN GRID: Mobile-first stacked, Desktop 8/4 split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">

                    {/* ========== MAIN FORM COLUMN (col-span-8 = 66%) ========== */}
                    <div className="lg:col-span-8 order-2 lg:order-1">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h1 className="text-xl font-bold text-gray-900">إتمام الطلب</h1>
                                <Link href={`/${tenantSlug}/cart`} className="text-sm text-gray-500 hover:text-primary transition-colors">
                                    ← العودة للسلة
                                </Link>
                            </div>

                            <div className="p-6 lg:p-8 space-y-8">
                                {/* === SECTION 1: DELIVERY INFO === */}
                                <section>
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold">1</span>
                                        <h2 className="text-lg font-semibold text-gray-900">معلومات التوصيل</h2>
                                    </div>

                                    {/* Name & Phone */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">الاسم بالكامل *</Label>
                                            <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="محمد أحمد"
                                                className={`h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white text-base ${errors.fullName ? "border-red-400 focus:border-red-400" : "focus:border-primary"}`} />
                                            {errors.fullName && <p className="text-xs text-red-500 mt-1.5">{errors.fullName}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">رقم الهاتف *</Label>
                                            <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="01xxxxxxxxx"
                                                className={`h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white text-base ${errors.phone ? "border-red-400 focus:border-red-400" : "focus:border-primary"}`} />
                                            {errors.phone && <p className="text-xs text-red-500 mt-1.5">{errors.phone}</p>}
                                        </div>
                                    </div>

                                    {/* Auto Location */}
                                    <button type="button" onClick={handleGetLocation} disabled={locationLoading}
                                        className="w-full h-12 mb-5 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary flex items-center justify-center gap-2 transition-all text-sm font-medium">
                                        {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                        تحديد موقعي تلقائياً
                                    </button>

                                    {/* Governorate & City */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">المحافظة *</Label>
                                            <div className="relative">
                                                <select name="governorate" value={formData.governorate} onChange={handleChange}
                                                    className={`w-full h-12 px-4 pr-10 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-base appearance-none cursor-pointer ${errors.governorate ? "border-red-400" : ""}`}>
                                                    <option value="">اختر المحافظة</option>
                                                    {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                                                </select>
                                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                            </div>
                                            {errors.governorate && <p className="text-xs text-red-500 mt-1.5">{errors.governorate}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">المدينة / المنطقة</Label>
                                            <Input name="city" value={formData.city} onChange={handleChange} placeholder="مدينة نصر"
                                                className="h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-primary text-base" />
                                        </div>
                                    </div>

                                    {/* Street */}
                                    <div className="mb-5">
                                        <Label className="text-sm font-medium text-gray-700 mb-2 block">الشارع *</Label>
                                        <Input name="street" value={formData.street} onChange={handleChange} placeholder="شارع التحرير"
                                            className={`h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white text-base ${errors.street ? "border-red-400 focus:border-red-400" : "focus:border-primary"}`} />
                                        {errors.street && <p className="text-xs text-red-500 mt-1.5">{errors.street}</p>}
                                    </div>

                                    {/* Building Details */}
                                    <div className="grid grid-cols-3 gap-4 mb-5">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">رقم العمارة</Label>
                                            <Input name="building" value={formData.building} onChange={handleChange} placeholder="12" className="h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white text-center text-base" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">الدور</Label>
                                            <Input name="floor" value={formData.floor} onChange={handleChange} placeholder="3" className="h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white text-center text-base" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">الشقة</Label>
                                            <Input name="apartment" value={formData.apartment} onChange={handleChange} placeholder="5" className="h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white text-center text-base" />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-2 block">ملاحظات للمندوب (اختياري)</Label>
                                        <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="مثال: أمام البوابة الخلفية، الاتصال قبل الوصول..."
                                            rows={3} className="rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-primary resize-none text-base" />
                                    </div>
                                </section>

                                {/* Divider */}
                                <hr className="border-gray-100" />

                                {/* === SECTION 2: PAYMENT METHOD === */}
                                <section>
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold">2</span>
                                        <h2 className="text-lg font-semibold text-gray-900">طريقة الدفع</h2>
                                    </div>

                                    {/* Payment Dropdown */}
                                    <div className="relative">
                                        <button type="button" onClick={() => setPaymentOpen(!paymentOpen)}
                                            className="w-full h-14 px-5 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 flex items-center justify-between transition-all">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{selectedPayment.icon}</span>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">{selectedPayment.name}</p>
                                                    <p className="text-xs text-gray-500">{selectedPayment.desc}</p>
                                                </div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${paymentOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {paymentOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
                                                {PAYMENT_METHODS.map((method) => (
                                                    <button key={method.id} type="button" disabled={!method.enabled}
                                                        onClick={() => { if (method.enabled) { setFormData(prev => ({ ...prev, paymentMethod: method.id as "cod" | "card" })); setPaymentOpen(false); } }}
                                                        className={`w-full px-5 py-4 flex items-center gap-4 text-right transition-colors ${method.enabled ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-40 cursor-not-allowed'} ${formData.paymentMethod === method.id ? 'bg-primary/5' : ''}`}>
                                                        <span className="text-2xl">{method.icon}</span>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">{method.name}</p>
                                                            <p className="text-xs text-gray-500">{method.desc}</p>
                                                        </div>
                                                        {!method.enabled && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">قريباً</span>}
                                                        {formData.paymentMethod === method.id && <Check className="w-5 h-5 text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* ========== SIDEBAR: ORDER SUMMARY (col-span-4 = 33%) ========== */}
                    <div className="lg:col-span-4 order-1 lg:order-2">
                        <div className="lg:sticky lg:top-4">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <h2 className="text-lg font-bold text-gray-900">ملخص الطلب</h2>
                                </div>

                                <div className="p-6">
                                    {/* Cart Items Preview */}
                                    {cartItems.length > 0 && (
                                        <div className="space-y-3 mb-5 pb-5 border-b border-gray-100">
                                            {cartItems.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-500">×{item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-semibold">{(item.price / 100).toFixed(0)} ج.م</p>
                                                </div>
                                            ))}
                                            {cartItems.length > 3 && <p className="text-xs text-gray-400 text-center pt-1">+{cartItems.length - 3} منتجات أخرى</p>}
                                        </div>
                                    )}

                                    {/* Totals */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">المجموع</span>
                                            <span className="font-medium">{(total / 100).toFixed(2)} ج.م</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">الشحن</span>
                                            <span className="text-green-600 font-medium">مجاني</span>
                                        </div>
                                        <hr className="border-gray-100" />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span className="text-gray-900">الإجمالي</span>
                                            <span className="text-primary">{(total / 100).toFixed(2)} ج.م</span>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <Button type="submit" disabled={isProcessing} className="w-full h-14 rounded-xl text-base font-bold">
                                        {isProcessing ? <><Loader2 className="h-5 w-5 animate-spin ml-2" />جاري التأكيد...</> : <>تأكيد الطلب<ArrowRight className="h-5 w-5 mr-2" /></>}
                                    </Button>

                                    {/* Trust Badges */}
                                    <div className="mt-5 pt-5 border-t border-gray-100 flex justify-center gap-6 text-xs text-gray-400">
                                        <span>🔒 آمن</span>
                                        <span>📦 سريع</span>
                                        <span>↩️ إرجاع</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
