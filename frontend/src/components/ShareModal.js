import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useSharingStore } from '../stores/sharingStore';

const ShareModal = ({ noteId, workspaceId, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const [isSharing, setIsSharing] = useState(false);
  const { shareNote, shareWorkspace } = useSharingStore();

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSharing(true);
    try {
      if (workspaceId) {
        await shareWorkspace(workspaceId, {
          shared_with_email: email,
          permission_level: permission,
        });
      } else {
        await shareNote(noteId, {
          shared_with_email: email,
          permission_level: permission,
        });
      }

      setEmail('');
      setPermission('viewer');
      toast.success(`${workspaceId ? 'Workspace' : 'Note'} shared successfully!`);
      onClose();
    } catch (error) {
      toast.error(`Failed to share ${workspaceId ? 'workspace' : 'note'}`);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center px-4">
      <div className="bg-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">
          Share {workspaceId ? 'Workspace' : 'Note'}
        </h2>

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-orange-400/60"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Permission Level
            </label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-orange-400/60"
            >
              <option value="viewer" className="bg-slate-900 text-white">Viewer (Read Only)</option>
              <option value="editor" className="bg-slate-900 text-white">Editor (Can Edit)</option>
              <option value="admin" className="bg-slate-900 text-white">Admin (Full Control)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing}
              className="flex-1 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-orange-400 disabled:to-orange-400 text-white transition-colors shadow-lg"
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
