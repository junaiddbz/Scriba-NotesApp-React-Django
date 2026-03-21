import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { label: 'Weak', color: 'bg-red-500' },
      { label: 'Fair', color: 'bg-orange-500' },
      { label: 'Good', color: 'bg-yellow-500' },
      { label: 'Strong', color: 'bg-green-500' },
    ];

    return { strength, ...levels[strength - 1] || { label: '', color: '' } };
  };

  const passwordStrength = getPasswordStrength();

  useEffect(() => {
    const validateToken = async () => {
      if (!token || token === 'invalid') {
        setIsValidToken(false);
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsValidToken(true);
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
        toast.error('This reset link is invalid or has expired');
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSuccess(true);
      toast.success('Password reset successfully');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-md">
          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-lg text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="text-red-300" size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>

            <p className="text-white/80 mb-8">
              This password reset link is invalid or has expired. Please request a new one.
            </p>

            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold transition-colors"
            >
              Request New Link
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-md">
          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-lg text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheck className="text-green-300" size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-4">Password Reset Complete</h2>

            <p className="text-white/80 mb-8">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold rounded-full transition-all flex items-center justify-center gap-2 group shadow-lg shadow-orange-500/20"
            >
              Sign In
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] text-white flex">
      <div className="hidden lg:flex lg:w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/25 via-orange-500/10 to-transparent blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-between h-full">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Scriba" className="w-12 h-12 rounded-xl" />
            <span className="text-white font-bold text-2xl">Scriba</span>
          </div>

          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm w-fit">
              Lock it down
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Set your new password.
            </h1>
            <p className="text-white/80 text-lg max-w-lg">
              Create a strong, memorable password to keep your workspace secure.
            </p>
          </div>

          <p className="text-white/70 text-sm">Need help? Our team is here for you.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Scriba" className="w-12 h-12 rounded-xl" />
              <span className="text-white font-bold text-2xl">Scriba</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-lg">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-100 text-xs font-semibold mb-3">
                Secure reset
              </div>
              <h2 className="text-3xl font-bold">Create new password</h2>
              <p className="text-white/70 mt-2">Enter a strong password for your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">New password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-orange-400/60 transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.strength ? passwordStrength.color : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/70">
                      Password strength: <span className="font-semibold text-white">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Confirm new password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-orange-400/60 transition-all ${
                      confirmPassword && password !== confirmPassword ? 'border-red-500/60' : 'border-white/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-300">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || password !== confirmPassword || !password || !confirmPassword}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-orange-400 disabled:to-orange-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all flex items-center justify-center gap-2 group shadow-lg shadow-orange-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating password...
                  </span>
                ) : (
                  <>
                    Reset password
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-white/70">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-orange-200 hover:text-orange-100 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
