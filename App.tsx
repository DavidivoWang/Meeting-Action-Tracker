
import React, { useState, useMemo, useCallback } from 'react';
import { ActionItem, TestCase } from './types';
import ActionItemForm from './components/ActionItemForm';
import ActionItemList from './components/ActionItemList';
import TestCaseRunner from './components/TestCaseRunner';
import { extractActionItemsFromText } from './services/geminiService';
import { Layout, CheckSquare, List, TestTube, Sparkles, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tracker' | 'tests'>('tracker');

  const addItem = (newItem: Omit<ActionItem, 'id' | 'status'>) => {
    // Rule: No duplicate titles on the same due date
    const isDuplicate = items.some(
      (item) => item.title.toLowerCase() === newItem.title.toLowerCase() && item.dueDate === newItem.dueDate
    );

    if (isDuplicate) {
      setError(`An item with title "${newItem.title}" already exists for ${newItem.dueDate}.`);
      return false;
    }

    const item: ActionItem = {
      ...newItem,
      id: crypto.randomUUID(),
      status: 'Pending',
    };

    setItems((prev) => [...prev, item]);
    setError(null);
    return true;
  };

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === 'Pending' ? 'Done' : 'Pending' } : item
      )
    );
  };

  const updateItem = (id: string, updates: Partial<ActionItem>) => {
    const item = items.find(i => i.id === id);
    if (item?.status === 'Done') {
      setError("Cannot edit a completed action item.");
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    setError(null);
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [items]);

  const handleAiExtraction = async (text: string) => {
    if (!text.trim()) return;
    setIsAiLoading(true);
    try {
      const extracted = await extractActionItemsFromText(text);
      extracted.forEach((item: any) => addItem(item));
    } catch (err) {
      setError("AI failed to extract items. Please check your input.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <CheckSquare className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Meeting Action Tracker
              </h1>
            </div>
            
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('tracker')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'tracker'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
                Tracker
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'tests'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TestTube className="w-4 h-4" />
                Tests
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {activeTab === 'tracker' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar / Form */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Quick Add
                </h2>
                <ActionItemForm onAdd={addItem} />
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-lg border border-indigo-500 p-6 text-white">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Assistant
                </h2>
                <p className="text-indigo-100 text-sm mb-4">
                  Paste your raw meeting notes here and let Gemini extract action items automatically.
                </p>
                <textarea
                  placeholder="e.g. John will fix the login bug by Friday. Sarah to send slides tomorrow."
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all min-h-[120px]"
                  id="ai-notes"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('ai-notes') as HTMLTextAreaElement;
                    handleAiExtraction(el.value);
                    el.value = '';
                  }}
                  disabled={isAiLoading}
                  className="mt-4 w-full bg-white text-indigo-600 font-semibold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isAiLoading ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Extract Actions'
                  )}
                </button>
              </div>
            </div>

            {/* Main Content / List */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-semibold text-slate-900">Active Action Items</h2>
                  <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {items.length} Total
                  </span>
                </div>
                <ActionItemList 
                  items={sortedItems} 
                  onToggleStatus={toggleStatus} 
                  onUpdate={updateItem}
                />
              </div>
            </div>
          </div>
        ) : (
          <TestCaseRunner items={items} addItem={addItem} onToggleStatus={toggleStatus} />
        )}
      </main>
      
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            &copy; 2024 Meeting Action Tracker • Built with Gemini API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
