"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

export default function ResetPasswordPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [tenantSlug, setTenantSlug] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
    const [error, setError] = useState("");

    useEffect(() => {
        params.then(p => setTenantSlug(p.tenant));
    }, [params]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
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
                        mutation ResetPassword($token: String!, $password: String!) {
                            resetPassword(token: $token, password: $password) {
                                ... on CurrentUser {
                                    id
                                    identifier
                                }
                                ... on PasswordResetTokenInvalidError {
                                    message
                                }
                                ... on PasswordResetTokenExpiredError {
                                    message
                                }
                                ... on PasswordValidationError {
                                    message
                                }
                                ... on NativeAuthStrategyError {
                                    message
                                }
                            }
                        }
                    `,
                    variables: { token, password },
                }),
            });

            const result = await response.json();
            const resetResult = result.data?.resetPassword;

            if (resetResult?.id) {
                // Success - password has been reset and user is logged in
                setStatus("success");
            } else if (resetResult?.message) {
                setError(resetResult.message);
                setStatus("error");
            } else {
                setError("Failed to reset password. Please try again.");
                setStatus("error");
            }
        } catch (err) {
            console.error("Password reset error:", err);
            setError("An error occurred. Please try again.");
            setStatus("error");
        }
    };

    // No token provided
    if (!token) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg text-center">
                    <XCircle className="w-16 h-16 mx-auto text-red-500" />
                    <h1 className="text-2xl font-bold mt-4 text-red-600">Invalid Link</h1>
                    <p className="text-gray-600 mt-2">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link
                        href={`/${tenantSlug}/auth/forgot-password`}
                        className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    // Success state
    if (status === "success") {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg text-center">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                    <h1 className="text-2xl font-bold mt-4 text-green-600">Password Reset!</h1>
                    <p className="text-gray-600 mt-2">
                        Your password has been successfully changed. You can now login with your new password.
                    </p>
                    <Link
                        href={`/${tenantSlug}/auth/login`}
                        className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Error state
    if (status === "error") {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg text-center">
                    <XCircle className="w-16 h-16 mx-auto text-red-500" />
                    <h1 className="text-2xl font-bold mt-4 text-red-600">Reset Failed</h1>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <Link
                        href={`/${tenantSlug}/auth/forgot-password`}
                        className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    // Form state
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                    <p className="text-gray-500 mt-2">Enter your new password</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={status === "loading"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={status === "loading"}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={status === "loading"}>
                        {status === "loading" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
