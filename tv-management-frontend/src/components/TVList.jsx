// components/TVList.jsx
import React from 'react';
import TVListItem from './TVListItem';
// or: import TVCard from './TVCard';

export default function TVList({ tvs, onEdit, onDelete }) {
  if (!tvs?.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <div className="text-gray-400 text-6xl mb-4">📺</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No TVs Found</h3>
        <p className="text-gray-500">Add your first TV to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tvs.map((tv) => (
        <TVListItem
          key={tv.id || tv._id}
          tv={tv}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        // Or use TVCard if you prefer the card design:
        // <TVCard key={tv.id || tv._id} tv={tv} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
