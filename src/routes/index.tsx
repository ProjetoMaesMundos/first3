import React from 'react';
import { Link } from 'react-router-dom';

export default function Index() {
  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-4">First3</h1>
      <p className="text-gray-600 mb-6">Bem-vindo ao sistema. Acesse abaixo o seu diário unificado.</p>
      <div className="space-x-4 flex items-center">
        <Link
          to="/diario"
          className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Diário
        </Link>
        <span className="text-gray-600 font-medium px-2">Sinais</span>
      </div>
    </div>
  );
}
