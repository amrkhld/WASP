'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;
        
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name')?.toString().trim();
        const email = formData.get('email')?.toString().trim();
        const password = formData.get('password')?.toString();

 
        if (!name || !email || !password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Something went wrong');
            }

            router.push('/auth/login');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-content">
                <h2 className="auth-title">Create Account</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    <input
                        type="text"
                        name="name"
                        className="auth-input"
                        placeholder="Full name"
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        className="auth-input"
                        placeholder="Email address"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        className="auth-input"
                        placeholder="Password"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="auth-button"
                    >
                        {isLoading ? 'Creating account...' : 'Sign up'}
                    </button>
                    <div className="auth-link">
                        <a href="/auth/login">Already have an account? Sign in</a>
                    </div>
                </form>
            </div>
            <div className="auth-logo">
                <img src="/assests/logo.png" alt="Logo" />
            </div>
        </div>
    );
}
