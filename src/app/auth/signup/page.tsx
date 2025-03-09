'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface SignupData {
  name: string;
  email: string;
  password: string;
}

export default function SignUp() {
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      router.push('/auth/login?registered=true');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-container">
        <Image
          src="/assets/logo.png"
          alt="Logo"
          width={48}
          height={48}
          priority
        />
      </div>
      <h1>FREQUENCY NESTS</h1>
      <div className="auth-box">
        <h2>CREATE ACCESS</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="ENTER CALL SIGN"
            required
          />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ENTER EMAIL"
            required
          />
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="ENTER ACCESS CODE"
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit">CREATE ACCESS</button>
        </form>
        <div className="auth-links">
          <Link href="/auth/login">RETURN TO ACCESS</Link>
        </div>
      </div>
    </div>
  );
}
