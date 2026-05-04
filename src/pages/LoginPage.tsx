import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Loader2, ArrowLeft, KeyRound, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Checkbox } from '@/components/ui/checkbox';

type AuthMode = 'login' | 'forgot_password' | 'unconfirmed_email';

const LoginPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { localSuperAdminLogin } = useAuth();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const isRemembered = localStorage.getItem('rememberMe') === 'true';

    if (isRemembered) {
      setRememberMe(true);
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Save or clear credentials for autofill
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
      localStorage.setItem('rememberMe', 'false');
    }

    try {
      if (mode === 'login') {
        // Bypass Supabase for the specific superadmin credentials (Standalone mode)
        if (email.trim().toLowerCase() === 'dtinv1898@gmail.com' && password === '201-1589') {
          localSuperAdminLogin(rememberMe);
          toast({
            title: "Super Admin Login Successful",
            description: rememberMe 
              ? "Welcome back! Your session is remembered on this device."
              : "Welcome back! You are logged in for this session.",
          });
          navigate(from, { replace: true });
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setMode('unconfirmed_email');
            throw new Error("Hindi pa verified ang iyong email. Kailangan mo munang i-click ang confirmation link na ipinadala sa iyong email bago ka makapag-login.");
          }
          if (error.message.includes('Invalid login credentials')) {
            throw new Error("Mali ang email o password. Pakicheck ang iyong credentials at subukan muli.");
          }
          throw error;
        }
        
        toast({
          title: "Login Successful",
          description: "Welcome to the Admin Dashboard.",
        });
        navigate(from, { replace: true });
        
      } else if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        
        if (error) throw error;
        
        toast({
          title: "Reset Link Sent",
          description: "Please check your email for the password reset link.",
        });
        setMode('login');
      } else if (mode === 'unconfirmed_email') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        
        if (error) throw error;
        
        toast({
          title: "Confirmation Email Sent",
          description: "Muling ipinadala ang confirmation link. Pakicheck ang iyong email inbox o spam folder.",
        });
        setMode('login');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: mode === 'unconfirmed_email' ? "Email Not Verified" : "Authentication Error",
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-sky-500 relative">
        {mode !== 'login' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-2 top-2 h-8 w-8 text-muted-foreground"
            onClick={() => setMode('login')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <CardHeader className="space-y-2 text-center pb-6 pt-8">
          <div className="mx-auto w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-2">
            {mode === 'forgot_password' ? (
              <KeyRound className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            ) : mode === 'unconfirmed_email' ? (
              <Send className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            ) : (
              <Lock className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {mode === 'login' && 'Admin Login'}
            {mode === 'forgot_password' && 'Reset Password'}
            {mode === 'unconfirmed_email' && 'Verify Your Email'}
          </CardTitle>
          <CardDescription className="text-base">
            {mode === 'login' && 'Enter your credentials to access the dashboard'}
            {mode === 'forgot_password' && 'Enter your email to receive a reset link'}
            {mode === 'unconfirmed_email' && 'You need to confirm your email address before you can log in.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  autoFocus
                  disabled={mode === 'unconfirmed_email'}
                />
              </div>
            </div>
            {(mode === 'login') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-xs text-sky-600 hover:text-sky-700 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe} 
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Remember this device
                  </label>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold shadow-sm bg-sky-600 hover:bg-sky-700"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'login' && 'Sign In'}
              {mode === 'forgot_password' && 'Send Reset Link'}
              {mode === 'unconfirmed_email' && 'Resend Confirmation Email'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
