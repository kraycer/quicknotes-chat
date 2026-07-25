import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Shield, Lock, FileText, Check, Search } from 'lucide-react';

const DEFAULT_NOTES = [
  { id: '1', title: 'Lista de Supermercado', body: 'Leche, pan integral, huevos, café, frutas de temporada.', date: 'Hoy, 09:30 AM' },
  { id: '2', title: 'Recordatorio Taller', body: 'Llevar el vehículo a revisión preventiva el próximo viernes a las 8:00 AM.', date: 'Ayer' },
  { id: '3', title: 'Ideas de Proyecto', body: 'Rediseño de interfaz minimalista con modo oscuro y atajos rápidos.', date: '21 Jul' }
];

const SECRET_KEYWORDS = ['secret', 'vault', 'admin', 'pin', 'chat', 'pass'];

export default function DecoyNotepad({ onOpenPinModal }) {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('qn_decoy_notes');
      return saved ? JSON.parse(saved) : DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });

  const [search, setSearch] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('qn_decoy_notes', JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  }, [notes]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    // Secret Keyword Trigger in search bar!
    if (SECRET_KEYWORDS.some((kw) => val.toLowerCase().trim() === kw)) {
      setSearch('');
      onOpenPinModal();
    }
  };

  const handleCreate = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Nueva Nota',
      body: '',
      date: 'Ahora'
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setEditTitle(newNote.title);
    setEditBody(newNote.body);
  };

  const handleSave = () => {
    if (!activeNote) return;
    setNotes(notes.map(n => n.id === activeNote.id ? { ...n, title: editTitle, body: editBody } : n));
    setActiveNote(null);
  };

  const handleDelete = (id) => {
    setNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const filtered = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full h-[100dvh] bg-[#0B0F17] text-gray-200 safe-pt safe-pb overflow-hidden">
      {/* Header with Top Safe Area Padding */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#151C28] border-b border-gray-800 select-none pt-4 sm:pt-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <h1 
            onDoubleClick={onOpenPinModal}
            className="text-lg font-semibold tracking-wide text-gray-100 cursor-pointer hover:text-cyan-400 transition"
            title="Doble clic o toque en candado para desbloquear"
          >
            QuickNotes
          </h1>
        </div>

        <button
          onClick={onOpenPinModal}
          className="p-2 text-gray-400 hover:text-cyan-400 rounded-lg hover:bg-gray-800 transition"
          title="Acceso de Seguridad"
        >
          <Lock className="w-5 h-5" />
        </button>
      </header>

      {/* Editor Modal / View */}
      {activeNote ? (
        <div className="flex-1 flex flex-col p-4 bg-[#0B0F17]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
            <button 
              onClick={() => setActiveNote(null)}
              className="text-sm text-cyan-400 hover:underline"
            >
              ← Volver a la lista
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              <Check className="w-4 h-4" /> Guardar
            </button>
          </div>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Título de la nota..."
            className="w-full bg-transparent text-xl font-bold text-gray-100 mb-3 outline-none border-b border-gray-800 pb-2"
          />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            placeholder="Escribe el contenido de tu nota aquí..."
            className="flex-1 w-full bg-transparent text-gray-300 outline-none resize-none leading-relaxed"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search bar with Secret Keyword Trigger */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar notas..."
              className="w-full pl-9 pr-4 py-2 bg-[#151C28] border border-gray-800 rounded-xl text-sm text-gray-200 outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No hay notas guardadas
              </div>
            ) : (
              filtered.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNote(note);
                    setEditTitle(note.title);
                    setEditBody(note.body);
                  }}
                  className="p-4 bg-[#151C28] border border-gray-800/80 rounded-2xl hover:border-cyan-500/30 transition cursor-pointer flex justify-between items-start group"
                >
                  <div className="flex-1 pr-3">
                    <h3 className="font-semibold text-gray-200 group-hover:text-cyan-400 transition mb-1">
                      {note.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                      {note.body || 'Sin contenido adicional...'}
                    </p>
                    <span className="text-[10px] text-gray-500">{note.date}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    className="p-1 text-gray-600 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* FAB Create button */}
          <button
            onClick={handleCreate}
            className="fixed bottom-6 right-6 p-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-600/30 transition flex items-center justify-center active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
