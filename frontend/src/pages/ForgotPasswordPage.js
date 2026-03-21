import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual forgot password API call
      // await authAPI.forgotPassword(email);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send reset instructions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-md">
          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-lg text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheck className="text-green-300" size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-4">
              Check your email
            </h2>

            <p className="text-white/80 mb-6">
              We've sent password reset instructions to <strong className="text-white">{email}</strong>
            </p>

            <p className="text-sm text-white/60 mb-8">
              Didn't receive the email? Check spam or contact support if you continue to have issues.
            </p>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold transition-colors"
            >
              <FiArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] text-white flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/25 via-orange-500/10 to-transparent blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-between h-full">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Scriba" className="w-12 h-12 rounded-xl" />
            <span className="text-white font-bold text-2xl">Scriba</span>
          </div>

          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm w-fit">
              Reset in seconds
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Forgot your password?
            </h1>
            <p className="text-white/80 text-lg max-w-lg">
              No worries. Enter your email and we'll send a secure link to reset your account.
            </p>
          </div>

          <p className="text-white/70 text-sm">
            Remembered it? <Link to="/login" className="font-semibold text-orange-200 hover:text-orange-100">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Reset Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Scriba" className="w-12 h-12 rounded-xl" />
              <span className="text-white font-bold text-2xl">Scriba</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-lg">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-100 text-xs font-semibold mb-3">
                Security first
              </div>
              <h2 className="text-3xl font-bold">
                Reset your password
              </h2>
              <p className="text-white/70 mt-2">
                Enter your email address and we'll send you a reset link
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-orange-400/60 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-orange-400 disabled:to-orange-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all flex items-center justify-center gap-2 group shadow-lg shadow-orange-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending instructions...
                  </span>
                ) : (
                  <>
                    Send reset instructions
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <FiArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-white/70">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-orange-200 hover:text-orange-100 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;