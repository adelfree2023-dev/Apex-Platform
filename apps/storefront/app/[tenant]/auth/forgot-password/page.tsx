"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

export default function ForgotPasswordPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const [tenantSlug, setTenantSlug] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
    const [error, setError] = useState("");

    params.then(p => setTenantSlug(p.tenant));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError("Please enter your email address");
            return;
        }

        setStatus("loading");
        setError("");

        try {
            const response = await fetch(VENDURE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "vendure-token": tenantSlug,
                },
                credentials: "include",
                body: JSON.stringify({
                    query: `
                        mutation RequestPasswordReset($email: String!) {
                            requestPasswordReset(emailAddress: $email) {
                                ... on Success {
                                    success
                                }
                                ... on NativeAuthStrategyError {
                                    message
                                }
                            }
                        }
                    `,
                    variables: { email },
                }),
            });

            const result = await response.json();
            const resetResult = result.data?.requestPasswordReset;

            if (resetResult?.success) {
                setStatus("success");
            } else if (resetResult?.message) {
                setError(resetResult.message);
                setStatus("form");
            } else {
                // Vendure returns success even if email doesn't exist (for security)
                setStatus("success");
            }
        } catch (err) {
            console.error("Password reset request error:", err);
            setError("An error occurred. Please try again.");
            setStatus("form");
        }
    };

    if (status === "success") {
        return (
            <div className="max-w-md mx-auto py-12 animate-fade-in">
                <div className="text-center bg-white rounded-2xl border p-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h1 className="text-2xl font-bold mt-4 text-gray-900">Check Your Email</h1>
                    <p className="text-gray-600 mt-2">
                        If an account exists for <strong>{email}</strong>,
                        you will receive a password reset link.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-sm text-blue-700">
                        Don't forget to check your spam folder!
                    </div>
                    <Link
                        href={`/${tenantSlug}/auth/login`}
                        className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto py-12 animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-500">
                    Enter your email and we'll send you a reset link
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border p-6">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={status === "loading"}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={status === "loading"}>
                    {status === "loading" ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        "Send Reset Link"
                    )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                    Check your spam folder if you don't see the email
                </p>
            </form>

            <div className="mt-6 text-center">
                <Button variant="ghost" asChild>
                    <Link href={`/${tenantSlug}/auth/login`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Link>
                </Button>
            </div>
        </div>
    );
}
