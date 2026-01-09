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

// Payment Methods - بالأولوية
const PAYMENT_METHODS = [
    // ⭐⭐⭐ الأولوية القصوى
    { id: "cod", name: "الدفع عند الاستلام", icon: "💵", desc: "نقداً للمندوب", enabled: true },
    { id: "instapay", name: "InstaPay", icon: "📱", desc: "تحويل فوري من أي بنك", enabled: true },
    { id: "vodafone-cash", name: "فودافون كاش", icon: "📲", desc: "محفظة فودافون", enabled: true },
    { id: "etisalat-cash", name: "اتصالات كاش", icon: "📲", desc: "محفظة اتصالات", enabled: true },
    { id: "orange-cash", name: "أورنج كاش", icon: "📲", desc: "محفظة أورنج", enabled: true },
    // ⭐⭐ أولوية متوسطة
    { id: "fawry", name: "فوري", icon: "🏪", desc: "ادفع في أي فرع فوري", enabled: true },
    // ⭐ أولوية منخفضة (قريباً)
    { id: "paymob", name: "بطاقة ائتمان", icon: "💳", desc: "Visa, Mastercard", enabled: false },
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
    notes: string; email: string;
    paymentMethod: "cod" | "instapay" | "vodafone-cash" | "etisalat-cash" | "orange-cash" | "fawry" | "paymob";
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
            {/* FULL WIDTH */}
            <div className="w-full">

                {/* RESPONSIVE FLEXBOX: stack on mobile, row on desktop */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ========== MAIN FORM (grows to fill) ========== */}
                    <div className="flex-1 lg:flex-[2]">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                            {/* Header with Breadcrumb */}
                            <div className="px-5 py-4 border-b border-gray-100">
                                <Link href={`/${tenantSlug}/cart`} className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5 mb-2 font-medium">
                                    ← العودة للسلة
                                </Link>
                                <h1 className="text-lg font-bold text-gray-900">إتمام الطلب</h1>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Name & Phone - Same Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="الاسم بالكامل *"
                                            className={`h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-sm ${errors.fullName ? "border-red-400" : "focus:border-primary"}`} />
                                        {errors.fullName && <p className="text-[10px] text-red-500 mt-1">{errors.fullName}</p>}
                                    </div>
                                    <div>
                                        <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="رقم الهاتف * (01xxxxxxxxx)"
                                            className={`h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-sm ${errors.phone ? "border-red-400" : "focus:border-primary"}`} />
                                        {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
                                    </div>
                                </div>

                                {/* Auto Location */}
                                <button type="button" onClick={handleGetLocation} disabled={locationLoading}
                                    className="w-full h-10 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary flex items-center justify-center gap-2 transition-all text-sm">
                                    {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                    📍 تحديد موقعي تلقائياً
                                </button>

                                {/* Governorate & City - Same Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <select name="governorate" value={formData.governorate} onChange={handleChange}
                                            className={`w-full h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary outline-none text-sm appearance-none cursor-pointer ${errors.governorate ? "border-red-400" : ""}`}>
                                            <option value="">المحافظة *</option>
                                            {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                                        </select>
                                        <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        {errors.governorate && <p className="text-[10px] text-red-500 mt-1">{errors.governorate}</p>}
                                    </div>
                                    <Input name="city" value={formData.city} onChange={handleChange} placeholder="المدينة / المنطقة"
                                        className="h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white focus:border-primary text-sm" />
                                </div>

                                {/* Street */}
                                <div>
                                    <Input name="street" value={formData.street} onChange={handleChange} placeholder="الشارع *"
                                        className={`h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-sm ${errors.street ? "border-red-400" : "focus:border-primary"}`} />
                                    {errors.street && <p className="text-[10px] text-red-500 mt-1">{errors.street}</p>}
                                </div>

                                {/* Building / Floor / Apartment - Same Row */}
                                <div className="grid grid-cols-3 gap-2">
                                    <Input name="building" value={formData.building} onChange={handleChange} placeholder="رقم العمارة *" className="h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-center text-sm" />
                                    <Input name="floor" value={formData.floor} onChange={handleChange} placeholder="الدور *" className="h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-center text-sm" />
                                    <Input name="apartment" value={formData.apartment} onChange={handleChange} placeholder="الشقة *" className="h-11 rounded-lg bg-gray-50 border-gray-200 focus:bg-white text-center text-sm" />
                                </div>

                                {/* Notes */}
                                <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="ملاحظات للمندوب (اختياري) - مثال: أمام البوابة الخلفية..."
                                    rows={2} className="rounded-lg bg-gray-50 border-gray-200 focus:bg-white focus:border-primary resize-none text-sm" />

                                {/* Payment Method - Compact */}
                                <div className="relative">
                                    <button type="button" onClick={() => setPaymentOpen(!paymentOpen)}
                                        className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white flex items-center justify-between transition-all">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{selectedPayment.icon}</span>
                                            <span className="font-medium text-sm">{selectedPayment.name}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${paymentOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {paymentOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden">
                                            {PAYMENT_METHODS.map((method) => (
                                                <button key={method.id} type="button" disabled={!method.enabled}
                                                    onClick={() => { if (method.enabled) { setFormData(prev => ({ ...prev, paymentMethod: method.id as FormData["paymentMethod"] })); setPaymentOpen(false); } }}
                                                    className={`w-full px-4 py-3 flex items-center gap-3 text-right text-sm ${method.enabled ? 'hover:bg-gray-50' : 'opacity-40 cursor-not-allowed'} ${formData.paymentMethod === method.id ? 'bg-primary/5' : ''}`}>
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

                    {/* ========== SIDEBAR: ORDER SUMMARY ========== */}
                    <div className="lg:w-[380px] flex-shrink-0">
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
