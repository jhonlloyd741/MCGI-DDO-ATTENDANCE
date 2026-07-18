import React, { useState } from 'react';
import { useStore, Locale, GatheringType } from '../store/store';
import { v4 as uuidv4 } from 'uuid';
import { MapPin, Calendar, ShieldAlert, Plus, Save, Trash2, Database } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'locales' | 'gatherings' | 'system' | 'audit'>('locales');
  const locales = useStore(state => state.locales);
  const gatheringTypes = useStore(state => state.gatheringTypes);
  const auditLogs = useStore(state => state.auditLogs);
  const addLocale = useStore(state => state.addLocale);
  const updateLocale = useStore(state => state.updateLocale);
  const addGatheringType = useStore(state => state.addGatheringType);
  const updateGatheringType = useStore(state => state.updateGatheringType);
  const clearData = useStore(state => state.clearData);

  const [newLocaleName, setNewLocaleName] = useState('');
  const [newLocaleDistrict, setNewLocaleDistrict] = useState('District 1');
  const [newLocaleMunicipality, setNewLocaleMunicipality] = useState('');
  const [newLocaleProvince, setNewLocaleProvince] = useState('Davao de Oro');
  
  const [newGatheringName, setNewGatheringName] = useState('');
  const [editingGatheringId, setEditingGatheringId] = useState<string | null>(null);
  const [editingGatheringName, setEditingGatheringName] = useState('');

  const [localeSearch, setLocaleSearch] = useState('');

  const handleAddLocale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocaleName) return;
    addLocale({
      id: uuidv4(),
      name: newLocaleName,
      district: newLocaleDistrict,
      municipality: newLocaleMunicipality,
      province: newLocaleProvince,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Active'
    });
    useStore.getState().addAuditLog({ user: 'Super Admin', action: `Added new locale: ${newLocaleName}` });
    setNewLocaleName('');
    setNewLocaleMunicipality('');
  };

  const handleAddGathering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGatheringName) return;
    addGatheringType({
      id: uuidv4(),
      name: newGatheringName,
      status: 'Open'
    });
    useStore.getState().addAuditLog({ user: 'Super Admin', action: `Added new gathering type: ${newGatheringName}` });
    setNewGatheringName('');
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(useStore.getState()));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "mcgi-ddo-backup-" + new Date().toISOString() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex h-full gap-6">
      <div className="w-64 bg-bg-card rounded-2xl shadow-sm border border-border-main p-4 flex flex-col space-y-2 shrink-0">
        <h2 className="text-lg font-bold px-2 mb-2">Settings</h2>
        <button
          onClick={() => setActiveTab('locales')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'locales' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0A3D91] dark:text-blue-400 font-bold' : 'hover:bg-bg-main'}`}
        >
          <MapPin size={18} />
          <span className="text-sm">Locales</span>
        </button>
        <button
          onClick={() => setActiveTab('gatherings')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'gatherings' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0A3D91] dark:text-blue-400 font-bold' : 'hover:bg-bg-main'}`}
        >
          <Calendar size={18} />
          <span className="text-sm">Gatherings</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'audit' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0A3D91] dark:text-blue-400 font-bold' : 'hover:bg-bg-main'}`}
        >
          <ShieldAlert size={18} />
          <span className="text-sm">Audit Trail</span>
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'system' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0A3D91] dark:text-blue-400 font-bold' : 'hover:bg-bg-main'}`}
        >
          <Database size={18} />
          <span className="text-sm">System & Backup</span>
        </button>
      </div>

      <div className="flex-1 bg-bg-card rounded-2xl shadow-sm border border-border-main p-6 h-[calc(100vh-140px)] flex flex-col overflow-y-auto">
        {activeTab === 'locales' && (
          <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Manage Locales</h2>
              <input 
                type="text" 
                placeholder="Search locales..." 
                value={localeSearch}
                onChange={(e) => setLocaleSearch(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm border border-border-main bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20 w-64"
              />
            </div>
            
            <form onSubmit={handleAddLocale} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-bg-main rounded-xl border border-border-main items-end shrink-0">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Locale Name</label>
                <input required value={newLocaleName} onChange={e => setNewLocaleName(e.target.value)} type="text" placeholder="e.g. Mawab" className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Municipality</label>
                <input required value={newLocaleMunicipality} onChange={e => setNewLocaleMunicipality(e.target.value)} type="text" placeholder="e.g. Mawab" className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Province</label>
                <input required value={newLocaleProvince} onChange={e => setNewLocaleProvince(e.target.value)} type="text" className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20" />
              </div>
              <button type="submit" className="bg-[#0A3D91] text-white w-full py-2.5 rounded-lg font-bold flex items-center justify-center space-x-2">
                <Plus size={16} />
                <span>Add Locale</span>
              </button>
            </form>

            <div className="flex-1 border border-border-main rounded-xl overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-bg-main sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Locale Name</th>
                    <th className="px-4 py-3">Municipality</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locales.filter(l => l.name.toLowerCase().includes(localeSearch.toLowerCase()) || l.municipality.toLowerCase().includes(localeSearch.toLowerCase())).map(locale => (
                    <tr key={locale.id} className="border-t border-border-main hover:bg-bg-main">
                      <td className="px-4 py-3 font-bold">{locale.name}</td>
                      <td className="px-4 py-3">{locale.municipality}, {locale.province}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase ${locale.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : locale.status === 'Inactive' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {locale.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            const newStatus = locale.status === 'Active' ? 'Inactive' : 'Active';
                            updateLocale(locale.id, { status: newStatus });
                            useStore.getState().addAuditLog({ user: 'Super Admin', action: `Changed locale ${locale.name} status to ${newStatus}` });
                          }}
                          className="text-xs font-bold text-[#0A3D91] hover:underline"
                        >
                          Toggle Status
                        </button>
                        <button
                          onClick={() => {
                            updateLocale(locale.id, { status: 'Archived' });
                            useStore.getState().addAuditLog({ user: 'Super Admin', action: `Archived locale ${locale.name}` });
                          }}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to permanently delete this locale?')) {
                              useStore.getState().deleteLocale(locale.id);
                              useStore.getState().addAuditLog({ user: 'Super Admin', action: `Permanently deleted locale ${locale.name}` });
                            }
                          }}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gatherings' && (
          <div className="space-y-6 flex flex-col h-full">
            <h2 className="text-xl font-bold">Manage Gatherings</h2>
            
            <form onSubmit={handleAddGathering} className="flex gap-4 p-4 bg-bg-main rounded-xl border border-border-main items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Gathering Name</label>
                <input required value={newGatheringName} onChange={e => setNewGatheringName(e.target.value)} type="text" placeholder="e.g. Bible Study" className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20" />
              </div>
              <button type="submit" className="bg-[#0A3D91] text-white px-6 py-2.5 rounded-lg font-bold flex items-center space-x-2">
                <Plus size={16} />
                <span>Add Gathering</span>
              </button>
            </form>

            <div className="flex-1 border border-border-main rounded-xl overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-bg-main sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Gathering Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gatheringTypes.map(gathering => {
                    const isEditing = editingGatheringId === gathering.id;
                    return (
                      <tr key={gathering.id} className="border-t border-border-main hover:bg-bg-main">
                        <td className="px-4 py-3 font-bold">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingGatheringName}
                              onChange={(e) => setEditingGatheringName(e.target.value)}
                              className="border border-border-main px-2 py-1 rounded-lg text-sm bg-bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20 w-full max-w-xs"
                              autoFocus
                            />
                          ) : (
                            gathering.name
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase ${gathering.status === 'Open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                            {gathering.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => {
                                  if (editingGatheringName.trim()) {
                                    updateGatheringType(gathering.id, { name: editingGatheringName.trim() });
                                    useStore.getState().addAuditLog({ user: 'Super Admin', action: `Renamed gathering type to ${editingGatheringName.trim()}` });
                                    setEditingGatheringId(null);
                                  }
                                }}
                                className="text-xs font-bold text-green-600 hover:underline"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingGatheringId(null)}
                                className="text-xs font-bold text-text-muted hover:underline"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingGatheringId(gathering.id);
                                  setEditingGatheringName(gathering.name);
                                }}
                                className="text-xs font-bold text-[#0A3D91] hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  const newStatus = gathering.status === 'Open' ? 'Closed' : 'Open';
                                  updateGatheringType(gathering.id, { status: newStatus });
                                  useStore.getState().addAuditLog({ user: 'Super Admin', action: `Changed gathering type ${gathering.name} status to ${newStatus}` });
                                }}
                                className="text-xs font-bold text-slate-600 hover:underline"
                              >
                                Toggle Status
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete the gathering type "${gathering.name}"?`)) {
                                    useStore.getState().deleteGatheringType(gathering.id);
                                    useStore.getState().addAuditLog({ user: 'Super Admin', action: `Deleted gathering type ${gathering.name}` });
                                  }
                                }}
                                className="text-xs font-bold text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6 flex flex-col h-full">
            <h2 className="text-xl font-bold">System Audit Trail</h2>
            <div className="flex-1 overflow-y-auto border border-border-main rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-bg-main sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-t border-border-main hover:bg-bg-main">
                      <td className="px-4 py-3 font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold">{log.user}</td>
                      <td className="px-4 py-3 text-text-muted">{log.action}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-text-muted">No audit logs available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">System Settings</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-bg-main p-6 rounded-2xl border border-border-main space-y-4">
                <div className="flex items-center space-x-3 text-[#0A3D91] dark:text-blue-400">
                  <Database size={24} />
                  <h3 className="font-bold text-lg">Backup & Export</h3>
                </div>
                <p className="text-sm text-text-muted">Export all system data including members, attendance records, locales, and settings to a JSON file.</p>
                <button onClick={handleBackup} className="w-full bg-[#0A3D91] text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2">
                  <Save size={18} />
                  <span>Download Backup</span>
                </button>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 space-y-4">
                <div className="flex items-center space-x-3 text-red-600">
                  <ShieldAlert size={24} />
                  <h3 className="font-bold text-lg">Danger Zone</h3>
                </div>
                <p className="text-sm text-red-800 dark:text-red-300">Wipe all members and attendance records from the local system. This action cannot be undone.</p>
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete all members and attendance records? This cannot be undone.")) {
                      clearData();
                      alert("Data cleared.");
                    }
                  }} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Trash2 size={18} />
                  <span>Clear All Data</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
