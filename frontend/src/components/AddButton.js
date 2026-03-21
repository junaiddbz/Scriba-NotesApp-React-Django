import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';

const AddButton = ({ onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/note/new');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95 z-40"
      title="Create new note"
      aria-label="Create new note"
    >
      <FiPlus size={24} />
    </button>
  );
};

export default AddButton;