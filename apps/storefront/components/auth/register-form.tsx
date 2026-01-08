"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { bindCartToCustomer } from "@/lib/vendure-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

interface RegisterFormProps {
    tenantSlug: string;
    channelToken: string;
}

export function RegisterForm({ tenantSlug, channelToken }: RegisterFormProps) {
    const router = useRouter();
    const { register, isLoading } = useAuthStore(tenantSlug);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting || success) return;

        setError("");
        setIsSubmitting(true);

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            setError("Please fill in all fields");
            setIsSubmitting(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsSubmitting(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsSubmitting(false);
            return;
        }

        const result = await register(
            {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
            },
            channelToken
        );

        if (result) {
            // Bind any guest cart to the newly registered customer
            // This transfers products added before registration to the new account
            await bindCartToCustomer(channelToken, {
                emailAddress: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
            });

            setSuccess(true);
            // Redirect to account page after short delay
            setTimeout(() => {
                router.push(`/${tenantSlug}/account`);
                router.refresh();
            }, 1500);
        } else {
            setError("Registration failed. Email may already be in use.");
            setIsSubmitting(false);
        }
    };

    // Show success message - email verification required
    if (success) {
        return (
            <div className="text-center space-y-4 bg-white rounded-2xl border p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900">Account Created!</h3>
                <p className="text-gray-600">
                    Welcome, {formData.firstName}! We've sent a verification email to:
                </p>
                <p className="font-medium text-gray-900">{formData.email}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    Please check your email and click the verification link to activate your account.
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push(`/${tenantSlug}/auth/login`)}
                    className="mt-4"
                >
                    Go to Login
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border p-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                    </>
                ) : (
                    "Create Account"
                )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
        </form>
    );
}
