import React from 'react';
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';

/**
 * Reusable Confirmation Modal Component
 *
 * Usage:
 * <ConfirmationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleConfirm}
 *   title="Delete Note"
 *   message="Are you sure you want to delete this note?"
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   variant="danger"
 * />
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning', // 'warning', 'danger', 'info', 'success'
  isLoading = false,
  children,
}) => {
  if (!isOpen) return null;

  const variants = {
    warning: {
      icon: FiAlertTriangle,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
      borderColor: 'border-yellow-700/30',
    },
    danger: {
      icon: FiAlertTriangle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/20',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      borderColor: 'border-red-700/30',
    },
    info: {
      icon: FiInfo,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-700/30',
    },
    success: {
      icon: FiCheckCircle,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/20',
      buttonColor: 'bg-green-500 hover:bg-green-600',
      borderColor: 'border-green-700/30',
    },
  };

  const config = variants[variant] || variants.warning;
  const Icon = config.icon;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-gray-800 rounded-lg shadow-xl max-w-md w-full border ${config.borderColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <Icon className={config.iconColor} size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="modal-title"
              className="text-lg font-semibold text-white"
            >
              {title}
            </h3>
            <p className="text-gray-400 mt-1 text-sm">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <FiX size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Custom Content */}
        {children && (
          <div className="px-6 pb-4">
            {children}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 ${config.buttonColor} disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for easier modal state management
 */
export const useConfirmationModal = () => {
  const [modalState, setModalState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: null,
  });

  const openModal = ({
    title,
    message,
    variant = 'warning',
    onConfirm,
    confirmText,
    cancelText,
  }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      variant,
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    modalState,
    openModal,
    closeModal,
    ConfirmationModalComponent: () => (
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={async () => {
          if (modalState.onConfirm) {
            await modalState.onConfirm();
          }
          closeModal();
        }}
        title={modalState.title}
        message={modalState.message}
        variant={modalState.variant}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    ),
  };
};

export default ConfirmationModal;