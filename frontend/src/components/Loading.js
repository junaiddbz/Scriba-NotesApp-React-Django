import React from 'react';

/**
 * Reusable Loading Indicator Component
 *
 * Usage:
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" />
 * <LoadingSpinner text="Loading notes..." />
 * <LoadingOverlay isLoading={isLoading}>...content...</LoadingOverlay>
 */

// Simple spinning loader
export const LoadingSpinner = ({
  size = 'md',
  color = 'orange',
  className = '',
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colors = {
    orange: 'border-orange-500',
    white: 'border-white',
    gray: 'border-gray-400',
    blue: 'border-blue-500',
    green: 'border-green-500',
  };

  return (
    <div
      className={`${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

// Full page loading indicator
export const FullPageLoader = ({
  text = 'Loading...',
  showText = true,
}) => {
  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        {showText && (
          <p className="text-gray-400">{text}</p>
        )}
      </div>
    </div>
  );
};

// Section loading indicator
export const SectionLoader = ({
  text = 'Loading...',
  showText = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        {showText && (
          <p className="text-gray-400 text-sm">{text}</p>
        )}
      </div>
    </div>
  );
};

// Inline loading indicator (for buttons, etc.)
export const InlineLoader = ({
  text = 'Loading',
  size = 'sm',
  showText = true,
}) => {
  return (
    <span className="inline-flex items-center gap-2">
      <LoadingSpinner size={size} color="white" />
      {showText && <span>{text}</span>}
    </span>
  );
};

// Loading overlay for existing content
export const LoadingOverlay = ({
  isLoading,
  children,
  text = 'Loading...',
  blur = true,
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-900/70 flex items-center justify-center z-10 ${blur ? 'backdrop-blur-sm' : ''}`}>
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-3" />
            <p className="text-gray-300 text-sm">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton loader for content placeholders
export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
    card: 'rounded-lg h-32',
  };

  return (
    <div
      className={`bg-gray-700 animate-pulse ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

// Card skeleton for note/workspace list items
export const CardSkeleton = () => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton variant="title" width="60%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
        </div>
      </div>
    </div>
  );
};

// List skeleton for multiple items
export const ListSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

// Button loading state helper
export const LoadingButton = ({
  isLoading,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={isLoading || disabled}
      className={`${className} ${isLoading ? 'cursor-not-allowed' : ''}`}
      {...props}
    >
      {isLoading ? (
        <InlineLoader text={loadingText} />
      ) : (
        children
      )}
    </button>
  );
};

// Progress bar for longer operations
export const ProgressBar = ({
  progress = 0,
  showLabel = true,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-400 mt-1 text-right">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

// Default export for backwards compatibility
const Loading = {
  Spinner: LoadingSpinner,
  FullPage: FullPageLoader,
  Section: SectionLoader,
  Inline: InlineLoader,
  Overlay: LoadingOverlay,
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  Button: LoadingButton,
  Progress: ProgressBar,
};

export default Loading;