// Page de connexion des utilisateurs
'use client';

import dynamic from 'next/dynamic';

const LoginFormContent = dynamic(() => import('@/components/auth/login-form'), {
  ssr: false,
  loading: () => <div>Chargement...</div>
});

export default function LoginPage() {
  return <LoginFormContent />;
}