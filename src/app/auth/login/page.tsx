
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (isLoading) return;
        
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email')?.toString().trim();
        const password = formData.get('password')?.toString();

        if (!email || !password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.replace('/');
                router.refresh();
            }
        } catch (error) {
            setError('An unexpected error occurred');
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-content">
                <h2 className="auth-title">Sign in</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
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
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                    <div className="auth-link">
                        <a href="/auth/signup">Need an account? Sign up</a>
                    </div>
                </form>
            </div>
            <div className="auth-logo">
                <img src="/assests/logo.png" alt="Logo" />
            </div>
        </div>
    );
}