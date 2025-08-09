import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

export default function TVListItem({ tv, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{tv.name}</h3>
          <p className="text-sm text-gray-500">{tv.department}</p>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${
            tv.status === 'online' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </div>
      <div className="text-sm text-gray-600 space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Layout:</span>
          <span>{tv.layout === 1 ? 'Full Screen' : `${tv.layout} Split`}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span
            className={
              tv.status === 'online' ? 'text-green-600' : 'text-red-600'
            }
          >
            {tv.status}
          </span>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onEdit(tv)}
          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md text-sm flex items-center justify-center"
        >
          <Edit size={14} className="mr-1" />
          Edit
        </button>
        <button
          onClick={() => onDelete(tv.id || tv._id)}
          className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-md text-sm flex items-center justify-center"
        >
          <Trash2 size={14} className="mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
}
