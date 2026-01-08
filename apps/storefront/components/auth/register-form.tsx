"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { bindCartToCustomer } from "@/lib/vendure-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle, Phone, MapPin } from "lucide-react";
import { LocationPicker } from "./location-picker";

interface RegisterFormProps {
    tenantSlug: string;
    channelToken: string;
}

export function RegisterForm({ tenantSlug, channelToken }: RegisterFormProps) {
    const router = useRouter();
    const { register, login, isLoading } = useAuthStore(tenantSlug);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        street: "",
        province: "",
        notes: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Handle location detection from LocationPicker
    const handleLocationDetected = useCallback((location: { street: string; province: string }) => {
        setFormData((prev) => ({
            ...prev,
            street: location.street,
            province: location.province,
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting || success) return;

        setError("");
        setIsSubmitting(true);

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
            setError("يرجى ملء جميع الحقول المطلوبة");
            setIsSubmitting(false);
            return;
        }

        // Phone validation - must be digits only and at least 10 digits
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            setError("رقم التليفون يجب أن يكون على الأقل 10 أرقام");
            setIsSubmitting(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            setIsSubmitting(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("كلمات المرور غير متطابقة");
            setIsSubmitting(false);
            return;
        }

        try {
            const result = await register(
                {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    phoneNumber: formData.phone, // Built-in field in Vendure 2.x
                    customFields: {
                        street: formData.street,
                        province: formData.province,
                        notes: formData.notes,
                    },
                },
                channelToken
            );

            if (result) {
                // Bind any guest cart to the newly registered customer
                await bindCartToCustomer(channelToken, {
                    emailAddress: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                });

                // Auto-login after registration (no verification required)
                const loginResult = await login(
                    formData.email,
                    formData.password,
                    channelToken
                );

                setSuccess(true);

                // Redirect to home/account page
                setTimeout(() => {
                    window.location.href = `/${tenantSlug}`;
                }, 1000);
            } else {
                setError("فشل التسجيل. الإيميل أو رقم التليفون قد يكون مستخدم بالفعل.");
                setIsSubmitting(false);
            }
        } catch (err) {
            // Check for specific error messages from the trigger
            const errorMessage = err instanceof Error ? err.message : '';
            if (errorMessage.includes('Email already registered') || errorMessage.includes('الإيميل مسجل')) {
                setError("هذا الإيميل مسجل بالفعل في هذا المتجر");
            } else if (errorMessage.includes('Phone number already registered') || errorMessage.includes('رقم التليفون مسجل')) {
                setError("رقم التليفون مسجل بالفعل في هذا المتجر");
            } else {
                setError("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
            }
            setIsSubmitting(false);
        }
    };

    // Show success message
    if (success) {
        return (
            <div className="text-center space-y-4 bg-white rounded-2xl border p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900">تم إنشاء الحساب بنجاح!</h3>
                <p className="text-gray-600">
                    مرحباً {formData.firstName}! جاري تحويلك للصفحة الرئيسية...
                </p>
                <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border p-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">الاسم الأول *</Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="أحمد"
                        disabled={isLoading}
                        dir="rtl"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">الاسم الأخير *</Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="محمد"
                        disabled={isLoading}
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    disabled={isLoading}
                    dir="ltr"
                />
            </div>

            {/* Phone */}
            <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    رقم التليفون *
                </Label>
                <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01xxxxxxxxx"
                    disabled={isLoading}
                    dir="ltr"
                />
            </div>

            {/* Location Section */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Label className="flex items-center gap-2 text-base font-medium">
                    <MapPin className="h-4 w-4" />
                    الموقع (اختياري)
                </Label>

                {/* Location Picker Button */}
                <LocationPicker
                    onLocationDetected={handleLocationDetected}
                    disabled={isLoading}
                />

                {/* Street - Always editable */}
                <div className="space-y-2">
                    <Label htmlFor="street">اسم الشارع</Label>
                    <Input
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="شارع 123، بجوار مسجد..."
                        disabled={isLoading}
                        dir="rtl"
                    />
                </div>

                {/* Province - Always editable */}
                <div className="space-y-2">
                    <Label htmlFor="province">المحافظة</Label>
                    <Input
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        placeholder="القاهرة"
                        disabled={isLoading}
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                />
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="أي ملاحظات إضافية..."
                    disabled={isLoading}
                    dir="rtl"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري إنشاء الحساب...
                    </>
                ) : (
                    "إنشاء حساب"
                )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
                بإنشاء حساب، أنت توافق على شروط الخدمة وسياسة الخصوصية.
            </p>
        </form>
    );
}
