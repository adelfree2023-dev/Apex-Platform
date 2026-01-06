"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const MANAGER_API = process.env.NEXT_PUBLIC_MANAGER_API_URL || "http://127.0.0.1:3000";

export default function VerifyEmailPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [tenantSlug, setTenantSlug] = useState("");

    useEffect(() => {
        params.then(p => setTenantSlug(p.tenant));
    }, [params]);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("رابط التحقق غير صالح");
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch(`${MANAGER_API}/api/auth/verify-email?token=${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus("success");
                    setMessage("تم تأكيد بريدك الإلكتروني بنجاح!");
                } else {
                    setStatus("error");
                    setMessage(data.message || "فشل التحقق من البريد الإلكتروني");
                }
            } catch (error) {
                setStatus("error");
                setMessage("حدث خطأ أثناء التحقق");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg animate-fade-in">
                {status === "loading" && (
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                        <h1 className="text-2xl font-bold mt-4">جاري التحقق...</h1>
                        <p className="text-gray-500 mt-2">يرجى الانتظار</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                        <h1 className="text-2xl font-bold mt-4 text-green-600">تم التأكيد!</h1>
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
                        <h1 className="text-2xl font-bold mt-4 text-red-600">فشل التحقق</h1>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <Link
                            href={`/${tenantSlug}/auth/register`}
                            className="inline-block mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                        >
                            إعادة التسجيل
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
