import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function LoginView() {
  const { users, login, setupAdmin, isAuthenticated, loading, lockedUntil } = useAuth();
  const navigate = useNavigate();

  const isSetupMode = users.length === 0;

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!lockedUntil) {
      setLockoutRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      return remaining;
    };

    const remaining = updateCountdown();
    if (remaining <= 0) return;

    const timer = setInterval(() => {
      const remaining = updateCountdown();
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockedUntil]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 4) {
      toast.error('Le PIN doit contenir exactement 4 chiffres');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(pin);
      if (result.success) {
        toast.success('Connexion réussie !');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error(result.error || 'PIN incorrect');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [pin, login, navigate]);

  const handleSetup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Veuillez entrer votre nom');
      return;
    }

    if (pin.length !== 4) {
      toast.error('Le PIN doit contenir exactement 4 chiffres');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('Les PIN ne correspondent pas');
      return;
    }

    setIsSubmitting(true);
    try {
      await setupAdmin(name.trim(), pin);
      toast.success('Administrateur créé avec succès !');
      navigate('/dashboard', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, pin, confirmPin, setupAdmin, navigate]);

  const isLocked = lockoutRemaining > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground font-display">
            {isSetupMode ? 'Configuration Initiale' : 'Connexion'}
          </h1>
          <p className="text-sm text-muted mt-2">
            {isSetupMode
              ? 'Créez votre compte administrateur pour commencer'
              : 'Entrez votre PIN pour accéder au système'}
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-lg p-6">
          {isSetupMode ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <Input
                label="Nom de l'administrateur"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                icon={<User className="h-4 w-4" />}
                disabled={isSubmitting}
                autoFocus
              />

              <div className="relative">
                <Input
                  label="PIN (4 chiffres)"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  icon={<Lock className="h-4 w-4" />}
                  disabled={isSubmitting}
                  pattern="[0-9]{4}"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-[38px] text-muted hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirmer le PIN"
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  icon={<Lock className="h-4 w-4" />}
                  disabled={isSubmitting}
                  pattern="[0-9]{4}"
                  inputMode="numeric"
                  error={confirmPin && pin !== confirmPin ? 'Les PIN ne correspondent pas' : undefined}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-6"
                disabled={isSubmitting || !name.trim() || pin.length !== 4 || pin !== confirmPin}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  'Créer le compte administrateur'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Input
                  label="PIN"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Entrez votre PIN"
                  maxLength={4}
                  icon={<Lock className="h-4 w-4" />}
                  disabled={isSubmitting || isLocked}
                  autoFocus
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-[38px] text-muted hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {isLocked && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-danger">
                    Trop de tentatives. Réessayez dans {lockoutRemaining}s
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-6"
                disabled={isSubmitting || isLocked || pin.length !== 4}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          {isSetupMode
            ? 'Ce compte sera l\'administrateur principal du système'
            : 'Session sécurisée par PIN • Déconnexion automatique à la fermeture du navigateur'}
        </p>
      </div>
    </div>
  );
}
