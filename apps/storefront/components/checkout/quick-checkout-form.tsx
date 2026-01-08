"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Loader2, MapPin, CreditCard, Truck } from "lucide-react";
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

interface QuickCheckoutFormProps {
    onSubmit: (shippingData: ShippingData, paymentData: PaymentData) => void;
    isProcessing: boolean;
    tenantSlug: string;
    channelToken: string;
    cartTotal: number;
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
    cartTotal
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
                    // Use reverse geocoding (free API)
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

        // Build full address
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            {/* Shipping Section */}
            <div className="bg-white rounded-2xl border p-6 space-y-5">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <Truck className="h-5 w-5 text-primary" />
                    <h2>معلومات التوصيل</h2>
                </div>

                {/* Name & Phone - Same Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">الاسم بالكامل *</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="محمد أحمد"
                            className={errors.fullName ? "border-red-500" : ""}
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
                            className={errors.phone ? "border-red-500" : ""}
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
                    className="w-full"
                >
                    {locationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                        <MapPin className="h-4 w-4 ml-2" />
                    )}
                    تحديد موقعي تلقائياً
                </Button>

                {/* Governorate & City - Same Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="governorate">المحافظة *</Label>
                        <select
                            id="governorate"
                            name="governorate"
                            value={formData.governorate}
                            onChange={handleChange}
                            className={`w-full h-10 px-3 rounded-md border ${errors.governorate ? "border-red-500" : "border-input"} bg-background`}
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
                        />
                    </div>
                </div>

                {/* Street */}
                <div className="space-y-2">
                    <Label htmlFor="street">الشارع *</Label>
                    <Input
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="شارع التحرير"
                        className={errors.street ? "border-red-500" : ""}
                    />
                    {errors.street && <p className="text-sm text-red-500">{errors.street}</p>}
                </div>

                {/* Building Details - 3 Small Fields */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="building">رقم العمارة</Label>
                        <Input
                            id="building"
                            name="building"
                            value={formData.building}
                            onChange={handleChange}
                            placeholder="12"
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
                        rows={2}
                    />
                </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2>طريقة الدفع</h2>
                </div>

                <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as "cod" | "card" }))}
                    className="space-y-3"
                >
                    <div className={`flex items-center space-x-3 space-x-reverse p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === "cod" ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                            <div className="font-medium">💵 الدفع عند الاستلام</div>
                            <p className="text-sm text-gray-500">ادفع نقداً للمندوب</p>
                        </Label>
                    </div>
                    <div className={`flex items-center space-x-3 space-x-reverse p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === "card" ? "border-primary bg-primary/5" : "hover:bg-gray-50"} opacity-50`}>
                        <RadioGroupItem value="card" id="card" disabled />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                            <div className="font-medium">💳 بطاقة ائتمان</div>
                            <p className="text-sm text-gray-500">قريباً - Visa, Mastercard</p>
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Order Summary & Submit */}
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">الإجمالي:</span>
                    <span className="text-2xl font-bold">{(cartTotal / 100).toFixed(2)} ج.م</span>
                </div>
                <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-white text-primary hover:bg-gray-100 font-bold text-lg h-14"
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
            </div>

            {/* Back Link */}
            <div className="text-center">
                <Link
                    href={`/${tenantSlug}/cart`}
                    className="text-gray-500 hover:text-gray-700 inline-flex items-center"
                >
                    <ArrowLeft className="h-4 w-4 ml-1" />
                    العودة للسلة
                </Link>
            </div>
        </form>
    );
}
