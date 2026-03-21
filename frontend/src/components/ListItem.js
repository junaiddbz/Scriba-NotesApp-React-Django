import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShare2, FiLock, FiUser } from 'react-icons/fi';
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

const ListItem = ({ note, shared = false, onClick }) => {
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

  if (note.permission === 'VIEWER') {
    accessIcon = FiLock;
    accessLabel = 'View Only';
    accessColor = 'text-blue-500';
  } else if (note.permission === 'EDITOR') {
    accessIcon = FiUser;
    accessLabel = 'Can Edit';
    accessColor = 'text-green-500';
  } else if (note.permission === 'ADMIN') {
    accessIcon = FiUser;
    accessLabel = 'Admin';
    accessColor = 'text-purple-500';
  } else if (shared) {
    accessIcon = FiShare2;
    accessLabel = 'Shared';
    accessColor = 'text-orange-500';
  }

  return (
    <button
      onClick={handleClick}
      className="w-full p-4 mb-3 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/60 hover:bg-white/10 transition-all text-left group shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
            {getTitle(note)}
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
  );
};

export default ListItem;