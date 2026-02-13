import React from 'react';
import { Activity, CheckCircle2, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '../../context/AuthContext';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../components/ui/core';

const DEMO_USERS = [
  { label: 'ADMIN', email: 'admin@vacina.local', password: 'Admin@123' },
  { label: 'ESCOLA (Operador)', email: 'operador.escola@vacina.local', password: 'Escola@123' },
  { label: 'ESCOLA (Gestor)', email: 'gestor.escola@vacina.local', password: 'Escola@123' },
  { label: 'SAÚDE (Profissional)', email: 'saude@vacina.local', password: 'Saude@123' },
  { label: 'SAÚDE (Gestor)', email: 'gestor.saude@vacina.local', password: 'Saude@123' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getDefaultRoute, isLoading, session } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (session) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [getDefaultRoute, navigate, session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso.');
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || getDefaultRoute(), { replace: true });
    } catch {
      toast.error('Credenciais inválidas. Verifique e tente novamente.');
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-stretch">
        <div className="relative hidden md:block rounded-2xl overflow-hidden shadow-2xl min-h-[640px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#063B4D] via-[#0B5D7A] to-[#0D7493]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_45%)]" />

          <div className="relative z-10 h-full p-10 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm border border-white/20">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold font-poppins tracking-tight">Projeto de Vacinação Contra o HPV</h1>
              </div>

              <h2 className="text-4xl font-extrabold leading-tight">
                Protegendo o futuro
                <br />
                <span className="text-[#F4A261]">de crianças e adolescentes.</span>
              </h2>

              <p className="text-blue-100 text-lg max-w-md mt-6">
                Plataforma integrada para gestão escolar e saúde com foco em cobertura vacinal contra o HPV.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20">
                <Shield className="text-[#9BE0D8]" />
                <span className="text-sm font-medium text-white">Acesso seguro</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20">
                <CheckCircle2 className="text-[#9BE0D8]" />
                <span className="text-sm font-medium text-white">Fluxo simplificado</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 self-stretch">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-[#0B5D7A]/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 md:hidden">
              <Activity className="h-6 w-6 text-[#0B5D7A]" />
            </div>
            <CardTitle className="text-2xl">Acesso ao sistema</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Entre com suas credenciais</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                data-testid="login-email"
                label="E-mail"
                type="email"
                placeholder="seu.email@instituicao.gov.br"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                data-testid="login-password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Button data-testid="login-submit" type="submit" className="w-full" isLoading={isLoading}>
                Entrar
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Credenciais demo</p>
              <div className="mt-3 space-y-2 text-xs text-gray-700">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.label}
                    type="button"
                    className="w-full text-left rounded-md border border-gray-200 bg-white px-3 py-2 hover:border-[#0B5D7A]/40"
                    onClick={() => fillDemo(user.email, user.password)}
                  >
                    <span className="font-semibold">{user.label}</span>: {user.email} / {user.password}
                  </button>
                ))}
              </div>
            </div>

            <a className="mt-4 inline-block text-xs text-[#0B5D7A] hover:underline" href="/api/docs/" target="_blank" rel="noreferrer">
              Abrir documentação da API (Swagger)
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
