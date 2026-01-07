"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

export default function VerifyEmailPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const searchParams = useSearchParams();
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
            setMessage("Invalid verification link - no token provided");
            return;
        }

        if (!tenantSlug) return; // Wait for tenant to load

        const verifyEmail = async () => {
            try {
                // Call Vendure's verifyCustomerAccount mutation
                const response = await fetch(VENDURE_API, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "vendure-token": tenantSlug, // Use tenant slug as channel token
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        query: `
                            mutation VerifyAccount($token: String!) {
                                verifyCustomerAccount(token: $token) {
                                    ... on CurrentUser {
                                        id
                                        identifier
                                    }
                                    ... on VerificationTokenInvalidError {
                                        message
                                    }
                                    ... on VerificationTokenExpiredError {
                                        message
                                    }
                                    ... on MissingPasswordError {
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
                        variables: { token },
                    }),
                });

                const result = await response.json();
                const verifyResult = result.data?.verifyCustomerAccount;

                if (verifyResult?.id) {
                    // Success - user is now verified
                    setStatus("success");
                    setMessage("Your email has been verified successfully! You can now login.");
                } else if (verifyResult?.message) {
                    // Error from Vendure
                    setStatus("error");
                    setMessage(verifyResult.message);
                } else {
                    setStatus("error");
                    setMessage("Verification failed. Please try again or contact support.");
                }
            } catch (error) {
                console.error("Verification error:", error);
                setStatus("error");
                setMessage("An error occurred during verification");
            }
        };

        verifyEmail();
    }, [token, tenantSlug]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg">
                {status === "loading" && (
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                        <h1 className="text-2xl font-bold mt-4">Verifying your email...</h1>
                        <p className="text-gray-500 mt-2">Please wait</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                        <h1 className="text-2xl font-bold mt-4 text-green-600">Email Verified!</h1>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <Link
                            href={`/${tenantSlug}/auth/login`}
                            className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                        >
                            Go to Login
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="text-center">
                        <XCircle className="w-16 h-16 mx-auto text-red-500" />
                        <h1 className="text-2xl font-bold mt-4 text-red-600">Verification Failed</h1>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <div className="mt-6 space-x-4">
                            <Link
                                href={`/${tenantSlug}/auth/register`}
                                className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                            >
                                Register Again
                            </Link>
                            <Link
                                href={`/${tenantSlug}`}
                                className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
