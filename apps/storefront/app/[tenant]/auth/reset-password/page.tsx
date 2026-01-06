"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

const MANAGER_API = process.env.NEXT_PUBLIC_MANAGER_API_URL || "http://127.0.0.1:3000";

export default function ResetPasswordPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
    const [message, setMessage] = useState("");
    const [tenantSlug, setTenantSlug] = useState("");

    params.then(p => setTenantSlug(p.tenant));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage("كلمات المرور غير متطابقة");
            return;
        }

        if (password.length < 8) {
            setMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
            return;
        }

        setStatus("loading");

        try {
            const response = await fetch(`${MANAGER_API}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage("تم تغيير كلمة المرور بنجاح!");
            } else {
                setStatus("error");
                setMessage(data.message || "فشل تغيير كلمة المرور");
            }
        } catch (error) {
            setStatus("error");
            setMessage("حدث خطأ أثناء تغيير كلمة المرور");
        }
    };

    if (!token) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 mx-auto text-red-500" />
                    <h1 className="text-2xl font-bold mt-4">رابط غير صالح</h1>
                    <p className="text-gray-500 mt-2">يرجى طلب رابط جديد لإعادة تعيين كلمة المرور</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg animate-fade-in">
                {status === "form" && (
                    <>
                        <div className="text-center mb-6">
                            <KeyRound className="w-12 h-12 mx-auto text-primary" />
                            <h1 className="text-2xl font-bold mt-4">إعادة تعيين كلمة المرور</h1>
                            <p className="text-gray-500 mt-2">أدخل كلمة المرور الجديدة</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    كلمة المرور الجديدة
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    تأكيد كلمة المرور
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {message && (
                                <p className="text-red-500 text-sm">{message}</p>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                            >
                                تغيير كلمة المرور
                            </button>
                        </form>
                    </>
                )}

                {status === "loading" && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                        <p className="mt-4 text-gray-500">جاري التغيير...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                        <h1 className="text-2xl font-bold mt-4 text-green-600">تم بنجاح!</h1>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <Link
                            href={`/${tenantSlug}/auth/login`}
                            className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="text-center">
                        <XCircle className="w-16 h-16 mx-auto text-red-500" />
                        <h1 className="text-2xl font-bold mt-4 text-red-600">فشل العملية</h1>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <Link
                            href={`/${tenantSlug}/auth/forgot-password`}
                            className="inline-block mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                        >
                            طلب رابط جديد
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
