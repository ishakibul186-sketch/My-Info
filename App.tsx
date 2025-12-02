import React, { useState, useEffect, useRef } from 'react';
import { subscribeToNotes, saveNote, deleteNote, toggleFavorite, subscribeToViewMode, saveViewMode } from './services/firebase';
import { Note } from './types';
import { 
  IconPlus, IconSettings, IconStar, IconTrash, IconEdit, IconArrowLeft, 
  IconBold, IconItalic, IconUnderline, IconMoon, IconSun, IconSearch,
  IconListBullet, IconListNumber, IconAlignLeft, IconAlignCenter, IconAlignRight,
  IconUndo, IconRedo, IconSort, IconGrid, IconList
} from './components/Icons';

// --- Components ---

// 0. Loading Screen
const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-200 dark:border-brand-900/50 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-600 dark:border-brand-400 rounded-full animate-spin border-t-transparent dark:border-t-transparent"></div>
    </div>
    <h2 className="mt-6 text-lg font-bold text-gray-800 dark:text-white animate-pulse">My Note</h2>
    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading your workspace...</p>
  </div>
);

// 1. Access Denied Screen (Replaces Auth Modal)
const AccessDenied: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a] p-4">
    <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center border border-[#334155]">
      <h1 className="text-4xl font-extrabold text-red-500 mb-6">Access Denied</h1>
      <p className="text-gray-300 text-lg leading-relaxed">
        Please access this application through the Apps Hive platform.
      </p>
    </div>
  </div>
);

// 2. Rich Text Editor
interface RichEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
}

const RichEditor: React.FC<RichEditorProps> = ({ initialContent, onChange }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [lastHtml, setLastHtml] = useState(initialContent);
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false,
    insertOrderedList: false
  });

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== initialContent) {
      contentRef.current.innerHTML = initialContent;
    }
    updateStats(initialContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent]);

  const updateStats = (html: string) => {
    // Basic text extraction for stats
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    setStats({ words, chars: text.length });
  };

  const checkFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const handleInput = () => {
    if (contentRef.current) {
      const html = contentRef.current.innerHTML;
      if (html !== lastHtml) {
        setLastHtml(html);
        onChange(html);
        updateStats(html);
      }
    }
    checkFormats();
  };

  const handleCursorActivity = () => {
    checkFormats();
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (contentRef.current) contentRef.current.focus();
    handleInput(); 
    checkFormats(); 
  };

  const getBtnClass = (isActive: boolean) => 
    `p-2 rounded transition-all duration-200 flex items-center justify-center ${
      isActive 
        ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 scale-105 shadow-sm ring-1 ring-brand-200 dark:ring-brand-700' 
        : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:scale-105'
    }`;

  const Divider = () => <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1 self-center"></div>;

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-300 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface shadow-sm transition-colors duration-300">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-gray-800/50">
        
        {/* Undo/Redo */}
        <div className="flex gap-1">
          <button onClick={() => execCmd('undo')} className={getBtnClass(false)} title="Undo"><IconUndo className="w-4 h-4" /></button>
          <button onClick={() => execCmd('redo')} className={getBtnClass(false)} title="Redo"><IconRedo className="w-4 h-4" /></button>
        </div>
        
        <Divider />

        {/* Basic Styles */}
        <button onClick={() => execCmd('bold')} className={getBtnClass(activeFormats.bold)} title="Bold">
          <IconBold className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('italic')} className={getBtnClass(activeFormats.italic)} title="Italic">
          <IconItalic className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('underline')} className={getBtnClass(activeFormats.underline)} title="Underline">
          <IconUnderline className="w-4 h-4" />
        </button>

        <Divider />

        {/* Font Size */}
        <select 
          onChange={(e) => execCmd('fontSize', e.target.value)} 
          className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 border-none outline-none focus:ring-0 cursor-pointer h-8"
        >
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>

        <Divider />

        {/* Alignment */}
        <button onClick={() => execCmd('justifyLeft')} className={getBtnClass(activeFormats.justifyLeft)} title="Align Left">
          <IconAlignLeft className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('justifyCenter')} className={getBtnClass(activeFormats.justifyCenter)} title="Align Center">
          <IconAlignCenter className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('justifyRight')} className={getBtnClass(activeFormats.justifyRight)} title="Align Right">
          <IconAlignRight className="w-4 h-4" />
        </button>

        <Divider />

        {/* Lists */}
        <button onClick={() => execCmd('insertUnorderedList')} className={getBtnClass(activeFormats.insertUnorderedList)} title="Bullet List">
          <IconListBullet className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('insertOrderedList')} className={getBtnClass(activeFormats.insertOrderedList)} title="Numbered List">
          <IconListNumber className="w-4 h-4" />
        </button>

        <Divider />

        {/* Highlights */}
        <div className="flex items-center gap-1 pl-1">
          <button 
            onClick={() => execCmd('hiliteColor', '#fde047')} 
            className="w-5 h-5 rounded-full bg-yellow-300 border border-gray-200 hover:scale-110 transition-transform" 
            title="Highlight Yellow"
          />
          <button 
            onClick={() => execCmd('hiliteColor', '#86efac')} 
            className="w-5 h-5 rounded-full bg-green-300 border border-gray-200 hover:scale-110 transition-transform" 
            title="Highlight Green"
          />
          <button 
            onClick={() => execCmd('hiliteColor', 'transparent')} 
            className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ml-1"
            title="Clear Highlight"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div 
        ref={contentRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={handleCursorActivity}
        onMouseUp={handleCursorActivity}
        className="flex-1 p-4 outline-none overflow-y-auto prose dark:prose-invert max-w-none editor-content text-gray-900 dark:text-gray-100"
        style={{ minHeight: '300px' }}
      />
      
      {/* Footer Stats */}
      <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-dark-border text-xs text-gray-400 flex justify-end gap-3 font-mono">
        <span>{stats.words} words</span>
        <span>{stats.chars} characters</span>
      </div>
    </div>
  );
};

// 3. Main App Container
enum Page {
  HOME = 'home',
  EDITOR = 'editor',
  SETTINGS = 'settings'
}

type SortOrder = 'newest' | 'oldest' | 'az';
type ViewMode = 'grid' | 'list';

const App: React.FC = () => {
  // Initialize userId and isLoading based on URL token OR localStorage
  const [userId, setUserId] = useState<string | null>(() => {
    // 1. Check URL for query parameter 'token'
    const urlParams = new URLSearchParams(window.location.search);
    const userIdToken = urlParams.get('token');

    if (userIdToken) {
      // Save valid token from URL to localStorage
      localStorage.setItem('my_note_userid', userIdToken);
      // Optional: Clean URL so the token isn't visible, but for now we keep it or rely on storage.
      // window.history.replaceState({}, '', window.location.pathname);
      return userIdToken;
    }
    
    // 2. Fallback to storage (cookies save)
    return localStorage.getItem('my_note_userid');
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If we have a user ID (from URL or Storage), we are loading data.
    // If we don't, we are not loading (we show Access Denied).
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const stored = localStorage.getItem('my_note_userid');
    return !!(token || stored);
  });
  
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New States for Sorting and View
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list

  // Editor State
  const [editorName, setEditorName] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [editorMessage, setEditorMessage] = useState('');

  // Init
  useEffect(() => {
    const savedTheme = localStorage.getItem('my_note_theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Notes subscription
  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      const unsubscribeNotes = subscribeToNotes(userId, (data) => {
        setNotes(data);
        setIsLoading(false);
      });
      
      const unsubscribeView = subscribeToViewMode(userId, (mode) => {
        setViewMode(mode);
      });

      return () => {
        unsubscribeNotes();
        unsubscribeView();
      };
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('my_note_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = () => {
    setUserId(null);
    localStorage.removeItem('my_note_userid');
    setNotes([]);
    setCurrentPage(Page.HOME);
    // After logout, since there is no ID, it will show Access Denied.
  };

  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setEditorName(note.name);
      setEditorTitle(note.title);
      setEditorMessage(note.message);
    } else {
      setEditingNote(null);
      setEditorName('');
      setEditorTitle('');
      setEditorMessage('');
    }
    setCurrentPage(Page.EDITOR);
  };

  const handleSaveNote = async () => {
    if (!userId) return;
    if (!editorTitle.trim() && !editorMessage.trim()) {
      alert("Please enter at least a title or message.");
      return;
    }

    try {
      await saveNote(userId, {
        id: editingNote?.id,
        name: editorName,
        title: editorTitle,
        message: editorMessage,
        isFavorite: editingNote?.isFavorite || false
      });
      setCurrentPage(Page.HOME);
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      if (userId) await deleteNote(userId, id);
    }
  };

  const handleToggleFav = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (userId) await toggleFavorite(userId, note.id, note.isFavorite);
  };

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (userId) {
      saveViewMode(userId, mode);
    }
  };

  // Filter and Sort notes
  const processedNotes = notes
    .filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') return b.timestamp - a.timestamp;
      if (sortOrder === 'oldest') return a.timestamp - b.timestamp;
      if (sortOrder === 'az') return a.title.localeCompare(b.title);
      return 0;
    });
  
  const favNotes = processedNotes.filter(n => n.isFavorite);
  const otherNotes = processedNotes.filter(n => !n.isFavorite);

  // Loading State
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Auth State - If no User ID found in URL or Storage -> ACCESS DENIED
  if (!userId) {
    return <AccessDenied />;
  }

  // --- Views ---

  const renderHome = () => (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">
              My Notes
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Welcome back, <span className="font-medium text-brand-600 dark:text-brand-400">{userId}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setCurrentPage(Page.SETTINGS)}
              className="p-2.5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm order-2 sm:order-1"
            >
              <IconSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="relative flex-1 sm:w-64 order-1 sm:order-2">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
             <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <IconSort className="w-4 h-4" />
                  <span className="capitalize">{sortOrder === 'az' ? 'A-Z' : sortOrder}</span>
                </button>
                <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-lg overflow-hidden hidden group-focus-within:block z-20">
                  <button onClick={() => setSortOrder('newest')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Newest</button>
                  <button onClick={() => setSortOrder('oldest')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Oldest</button>
                  <button onClick={() => setSortOrder('az')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">Title A-Z</button>
                </div>
             </div>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button 
              onClick={() => handleSetViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-surface shadow text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}
            >
              <IconGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleSetViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-surface shadow text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}
            >
              <IconList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Lists */}
      <main className="space-y-8">
        {favNotes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <IconStar className="w-5 h-5 text-yellow-500" filled />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Favorites</h2>
            </div>
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-3"}>
              {favNotes.map(note => <NoteCard key={note.id} note={note} viewMode={viewMode} />)}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {favNotes.length > 0 ? 'All Notes' : 'Recent Notes'}
            </h2>
          </div>
          {otherNotes.length === 0 && favNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <IconPlus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No notes yet. Create your first one!</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-3"}>
              {otherNotes.map(note => <NoteCard key={note.id} note={note} viewMode={viewMode} />)}
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => openEditor()}
        className="fixed bottom-6 right-6 p-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg shadow-brand-600/40 transition-transform hover:scale-110 active:scale-95 z-40 group"
      >
        <IconPlus className="w-7 h-7" />
        <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Add Note
        </span>
      </button>
    </div>
  );

  const NoteCard: React.FC<{ note: Note, viewMode: ViewMode }> = ({ note, viewMode }) => (
    <div 
      onClick={() => openEditor(note)}
      className={`group relative bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-[1.01] overflow-hidden ${viewMode === 'list' ? 'flex flex-row items-center p-4 gap-4' : 'p-5'}`}
    >
      <div className={`absolute left-0 top-0 bg-gradient-to-b from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${viewMode === 'list' ? 'w-1 h-full' : 'w-1 h-full'}`}></div>
      
      <div className={`flex-1 ${viewMode === 'list' ? 'flex items-center gap-4 min-w-0' : ''}`}>
        <div className={`flex justify-between items-start ${viewMode === 'list' ? 'flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1' : 'mb-2'}`}>
          <div className="min-w-0 flex-1">
             {note.name && <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider mb-0.5">{note.name}</p>}
             <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {note.title || 'Untitled'}
            </h3>
          </div>
          
          <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'order-first sm:order-last' : ''}`}>
             <button 
              onClick={(e) => handleToggleFav(e, note)}
              className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 ${note.isFavorite ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400'}`}
            >
              <IconStar className="w-5 h-5" filled={note.isFavorite} />
            </button>
          </div>
        </div>
        
        {viewMode === 'grid' && (
          <div 
            className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 h-14 [&>*]:text-gray-500 dark:[&>*]:text-gray-400"
            dangerouslySetInnerHTML={{ __html: note.message }}
          ></div>
        )}
      </div>

      <div className={`flex items-center ${viewMode === 'list' ? 'gap-4 border-l border-gray-100 dark:border-gray-800 pl-4 ml-2' : 'justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800'}`}>
        <span className="text-xs text-gray-400 font-mono whitespace-nowrap group-hover:text-brand-500/80 transition-colors">
          {new Date(note.timestamp).toLocaleDateString()}
        </span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button 
            onClick={(e) => handleDelete(e, note.id)}
            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <IconTrash className="w-4 h-4" />
          </button>
          {viewMode === 'grid' && (
             <button 
              onClick={(e) => { e.stopPropagation(); openEditor(note); }}
              className="p-1.5 text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors" 
              title="Edit"
            >
              <IconEdit className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderEditor = () => (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-border px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => setCurrentPage(Page.HOME)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <IconArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {editingNote ? 'Edit Note' : 'New Note'}
        </h2>
        <button 
          onClick={handleSaveNote}
          className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          Save
        </button>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Author Name</label>
            <input 
              type="text" 
              value={editorName} 
              onChange={(e) => setEditorName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Note Title</label>
            <input 
              type="text" 
              value={editorTitle} 
              onChange={(e) => setEditorTitle(e.target.value)}
              placeholder="Important Title"
              className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white transition-all shadow-sm font-bold"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
          <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-1">Message</label>
          <RichEditor 
            initialContent={editorMessage} 
            onChange={setEditorMessage}
          />
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg p-6">
      <div className="max-w-md mx-auto w-full">
        <button 
          onClick={() => setCurrentPage(Page.HOME)}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <IconArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Theme Mode</span>
              <button 
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  theme === 'dark' 
                    ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300' 
                    : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                }`}
              >
                {theme === 'dark' ? <IconMoon className="w-4 h-4" /> : <IconSun className="w-4 h-4" />}
                <span className="capitalize">{theme} Mode</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Current User ID</label>
                <div className="font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white select-all">
                  {userId}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-medium transition-colors border border-red-200 dark:border-red-900/30"
              >
                Log Out
              </button>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400">
            My Note App v1.0 • Built with React & Firebase
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 font-sans">
      {currentPage === Page.HOME && renderHome()}
      {currentPage === Page.EDITOR && renderEditor()}
      {currentPage === Page.SETTINGS && renderSettings()}
    </div>
  );
};

export default App;