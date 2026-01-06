import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";

export default async function ForgotPasswordPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant: tenantSlug } = await params;

    return (
        <div className="max-w-md mx-auto py-12 animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-500">
                    Enter your email and we&apos;ll send you a reset link
                </p>
            </div>

            <form className="space-y-6 bg-white rounded-2xl border p-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                    />
                </div>

                <Button type="submit" className="w-full">
                    Send Reset Link
                </Button>

                <p className="text-xs text-center text-gray-500">
                    Check your spam folder if you don&apos;t see the email
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
