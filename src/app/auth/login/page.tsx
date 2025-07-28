// Page de connexion des utilisateurs
import dynamic from 'next/dynamic';

const LoginFormContent = dynamic(() => import('@/components/auth/login-form'), {
  ssr: false,
});

export default function LoginPage() {
  return <LoginFormContent />;
}