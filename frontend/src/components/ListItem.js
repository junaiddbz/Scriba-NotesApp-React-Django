import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShare2, FiLock, FiUser, FiTrash2, FiStar, FiEyeOff } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const getTitle = (note) => {
  // Use title field if it exists and is not empty
  if (note.title && note.title.trim()) {
    let title = note.title;
    if (title.length > 50) {
      return title.slice(0, 50) + '...';
    }
    return title;
  }
  
  // Fallback to first line of body
  let title = note.body?.split('\n')[0] || 'Untitled Note';
  if (title.length > 50) {
    return title.slice(0, 50) + '...';
  }
  return title;
};

const getContent = (note) => {
  let body = note.body || '';
  
  // If body is empty, return empty string
  if (!body.trim()) {
    return '';
  }
  
  // Replace newlines with spaces for preview
  let content = body.replaceAll('\n', ' ').trim();
  
  // Truncate to 80 characters
  if (content.length > 80) {
    return content.slice(0, 80) + '...';
  }
  return content;
};

const ListItem = ({ note, shared = false, onClick, onDelete, onShare, onToggleFavorite, onToggleHide }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(note);
    } else {
      navigate(`/note/${note.id}`);
    }
  };

  const updatedTime = (note.updated_at || note.updated) ? 
    formatDistanceToNow(new Date(note.updated_at || note.updated), {
      addSuffix: true,
    }) : 'Unknown';

  // Determine access icon
  let accessIcon = null;
  let accessLabel = '';
  let accessColor = 'text-gray-500';

  if (note.user_permission === 'viewer') {
    accessIcon = FiLock;
    accessLabel = 'View Only';
    accessColor = 'text-blue-500';
  } else if (note.user_permission === 'editor') {
    accessIcon = FiUser;
    accessLabel = 'Can Edit';
    accessColor = 'text-green-500';
  } else if (note.user_permission === 'admin') {
    accessIcon = FiUser;
    accessLabel = 'Admin';
    accessColor = 'text-purple-500';
  } else if (shared) {
    accessIcon = FiShare2;
    accessLabel = 'Shared';
    accessColor = 'text-orange-500';
  }

  return (
    <div className="relative w-full mb-3 group">
      <button
        onClick={handleClick}
        className="w-full h-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/60 hover:bg-white/10 transition-all text-left shadow-lg"
      >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-orange-400 transition-colors flex items-center gap-2">
            {getTitle(note)}
            {note.is_favorite && <FiStar size={14} className="text-yellow-400 fill-current flex-shrink-0" />}
          </h3>
          {getContent(note) && (
            <p className="text-sm text-white/70 mt-1 line-clamp-2">
              {getContent(note)}
            </p>
          )}
        </div>

        {accessIcon && (
          <div className={`ml-2 ${accessColor}`} title={accessLabel}>
            {React.createElement(accessIcon, { size: 18 })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-white/50">
        <span>{updatedTime}</span>
        {note.workspace && (
          <span className="bg-white/10 px-2 py-1 rounded-full">
            {note.workspace.name}
          </span>
        )}
      </div>
      </button>

      {/* Floating Action Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(note); }}
            className="p-1.5 bg-gray-900/80 hover:bg-yellow-500 text-white/70 hover:text-white rounded-md backdrop-blur-md transition-colors shadow-lg border border-white/10 hover:border-yellow-400"
            title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <FiStar size={14} className={note.is_favorite ? 'text-yellow-400 fill-current group-hover:text-white' : ''} />
          </button>
        )}
        {onToggleHide && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleHide(note); }}
            className="p-1.5 bg-gray-900/80 hover:bg-orange-500 text-white/70 hover:text-white rounded-md backdrop-blur-md transition-colors shadow-lg border border-white/10 hover:border-orange-400"
            title="Hide from general notes"
          >
            <FiEyeOff size={14} />
          </button>
        )}
        {onShare && !note.workspace && !note.workspace_id && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(note); }}
            className="p-1.5 bg-gray-900/80 hover:bg-orange-500 text-white/70 hover:text-white rounded-md backdrop-blur-md transition-colors shadow-lg border border-white/10 hover:border-orange-400"
            title="Share note"
          >
            <FiShare2 size={14} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(note); }}
            className="p-1.5 bg-gray-900/80 hover:bg-red-500 text-white/70 hover:text-white rounded-md backdrop-blur-md transition-colors shadow-lg border border-white/10 hover:border-red-400"
            title="Delete note"
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ListItem;