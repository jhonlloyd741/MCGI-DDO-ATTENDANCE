import React, { useState, useRef } from 'react';
import { useStore, Member } from '../store/store';
import QRCode from 'react-qr-code';
import { Plus, Download, Upload, Trash2, Edit, RefreshCw, Archive, FileSpreadsheet } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export function Members() {
  const { members, locales, addMember, updateMember, deleteMember, restoreMember, hardDeleteMember, importMembers, addAuditLog } = useStore();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLocales = locales.filter(l => l.status === 'Active');
  
  const displayedMembers = members.filter(m => showArchived ? m.isDeleted : !m.isDeleted)
    .filter(m => m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || m.locale.toLowerCase().includes(searchQuery.toLowerCase()));
  const member = members.find(m => m.id === selectedMember);

  const [formData, setFormData] = useState<Partial<Member>>({});

  const handleAddNew = () => {
    setIsAdding(true);
    setSelectedMember(null);
    setFormData({
      fullName: '',
      birthdate: '',
      gender: 'Male',
      baptismDate: '',
      contactNumber: '',
      locale: activeLocales.length > 0 ? activeLocales[0].name : '',
      address: '',
      medicalCondition: false,
      maintenanceMedicine: false,
      status: 'Active',
    });
  };

  const handleEdit = (m: Member) => {
    setIsEditing(true);
    setFormData(m);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) {
      const newMember: Member = {
        ...(formData as Member),
        id: uuidv4(),
        registrationDate: new Date().toISOString()
      };
      addMember(newMember);
      addAuditLog({ user: 'Super Admin', action: `Added new member: ${newMember.fullName}` });
      setIsAdding(false);
      setSelectedMember(newMember.id);
    } else if (isEditing && member) {
      updateMember(member.id, formData);
      addAuditLog({ user: 'Super Admin', action: `Updated member: ${member.fullName}` });
      setIsEditing(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm("Are you sure you want to delete this member? They will be moved to the recycle bin.")) {
      deleteMember(id);
      addAuditLog({ user: 'Super Admin', action: `Soft deleted member: ${name}` });
      setSelectedMember(null);
    }
  };

  const handleRestore = (id: string, name: string) => {
    restoreMember(id);
    addAuditLog({ user: 'Super Admin', action: `Restored member: ${name}` });
  };

  const handleHardDelete = (id: string, name: string) => {
    if (confirm("WARNING: This will permanently delete the member. This cannot be undone. Proceed?")) {
      hardDeleteMember(id);
      addAuditLog({ user: 'Super Admin', action: `Permanently deleted member: ${name}` });
      setSelectedMember(null);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(displayedMembers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, `MCGI_Members_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addAuditLog({ user: 'Super Admin', action: 'Exported Member List' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const imported = data.reduce((acc, row) => {
          const rowName = row.fullName || 'Unknown';
          const rowBirthdate = row.birthdate || '';
          
          const isDuplicate = members.some(m => m.fullName.toLowerCase() === rowName.toLowerCase() && m.birthdate === rowBirthdate) || 
                              acc.some(m => m.fullName.toLowerCase() === rowName.toLowerCase() && m.birthdate === rowBirthdate);
          
          if (!isDuplicate) {
            acc.push({
              id: row.id || uuidv4(),
              fullName: rowName,
              birthdate: rowBirthdate,
              gender: row.gender || 'Male',
              baptismDate: row.baptismDate || '',
              contactNumber: row.contactNumber || '',
              locale: row.locale || (activeLocales[0]?.name || ''),
              address: row.address || '',
              medicalCondition: !!row.medicalCondition,
              maintenanceMedicine: !!row.maintenanceMedicine,
              status: row.status || 'Active',
              registrationDate: row.registrationDate || new Date().toISOString(),
              isDeleted: false
            });
          }
          return acc;
        }, [] as Member[]);

        if (imported.length === 0) {
          alert("No new members imported. All records in the file are duplicates.");
        } else {
          importMembers(imported);
          addAuditLog({ user: 'Super Admin', action: `Imported ${imported.length} members` });
          alert(`Successfully imported ${imported.length} members. Skipped ${data.length - imported.length} duplicates.`);
        }
      } catch (err) {
        alert("Error parsing file. Please ensure it's a valid Excel/CSV format.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 bg-bg-card rounded-2xl shadow-sm border border-border-main p-6 flex flex-col h-[calc(100vh-140px)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{showArchived ? 'Recycle Bin' : 'Member Directory'}</h2>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs border border-border-main bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20"
            />
            <button onClick={() => setShowArchived(!showArchived)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${showArchived ? 'bg-red-50 text-red-600 border-red-200' : 'bg-bg-main text-text-muted border-border-main'}`}>
              <Archive size={14} className="inline mr-1" />
              {showArchived ? 'Show Active' : 'Recycle Bin'}
            </button>
            <button onClick={handleExport} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
              <FileSpreadsheet size={14} className="inline mr-1" />
              Export
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
              <Upload size={14} className="inline mr-1" />
              Import
            </button>
            <input type="file" accept=".xlsx, .csv" hidden ref={fileInputRef} onChange={handleImport} />
            <button onClick={handleAddNew} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0A3D91] text-white hover:bg-[#072d6b]">
              <Plus size={14} className="inline mr-1" />
              Add Member
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-bg-main sticky top-0">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Name</th>
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedMembers.map(m => (
                <tr key={m.id} className="border-b border-border-main hover:bg-bg-main transition-colors">
                  <td className="px-4 py-4 font-bold">{m.fullName}</td>
                  <td className="px-4 py-4">{m.locale}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] rounded-full font-bold uppercase">{m.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => { setSelectedMember(m.id); setIsAdding(false); setIsEditing(false); }} className="text-[#0A3D91] hover:underline font-bold text-xs uppercase">View</button>
                  </td>
                </tr>
              ))}
              {displayedMembers.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-text-muted">No members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(member && !isAdding && !isEditing) && (
        <div className="w-96 bg-bg-card rounded-2xl shadow-sm border border-border-main p-6 flex flex-col h-[calc(100vh-140px)] overflow-y-auto shrink-0">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold">Profile</h2>
            <button onClick={() => setSelectedMember(null)} className="text-text-muted hover:text-text-main">✕</button>
          </div>
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-[#0A3D91] text-white rounded-full flex items-center justify-center text-3xl font-black mb-4">
              {member.fullName.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-center">{member.fullName}</h3>
            <p className="text-sm text-text-muted">{member.locale}</p>
          </div>

          <div className="flex space-x-2 justify-center mb-6">
            {!member.isDeleted && (
              <>
                <button onClick={() => handleEdit(member)} className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                  <Edit size={14} /> <span>Edit</span>
                </button>
                <button onClick={() => handleDelete(member.id, member.fullName)} className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold">
                  <Trash2 size={14} /> <span>Delete</span>
                </button>
              </>
            )}
            {member.isDeleted && (
              <>
                <button onClick={() => handleRestore(member.id, member.fullName)} className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
                  <RefreshCw size={14} /> <span>Restore</span>
                </button>
                <button onClick={() => handleHardDelete(member.id, member.fullName)} className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">
                  <Trash2 size={14} /> <span>Permanent Delete</span>
                </button>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-bg-main p-4 rounded-xl flex justify-center">
              <div className="bg-white p-2 rounded-lg">
                <QRCode value={member.id} size={150} />
              </div>
            </div>
            
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Member ID</p>
              <p className="text-sm font-mono">{member.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Birthdate</p>
              <p className="text-sm">{member.birthdate}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Baptism Date</p>
              <p className="text-sm">{member.baptismDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact</p>
              <p className="text-sm">{member.contactNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Address</p>
              <p className="text-sm">{member.address}</p>
            </div>
          </div>
        </div>
      )}

      {(isAdding || isEditing) && (
        <div className="w-96 bg-bg-card rounded-2xl shadow-sm border border-border-main p-6 flex flex-col h-[calc(100vh-140px)] overflow-y-auto shrink-0">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold">{isEditing ? 'Edit Member' : 'New Member'}</h2>
            <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="text-text-muted hover:text-text-main">✕</button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 flex-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Full Name</label>
              <input required value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} type="text" className="w-full border border-border-main p-2 rounded-lg text-sm bg-bg-main" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Birthdate</label>
              <input required value={formData.birthdate || ''} onChange={e => setFormData({...formData, birthdate: e.target.value})} type="date" className="w-full border border-border-main p-2 rounded-lg text-sm bg-bg-main" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Baptism Date</label>
              <input required value={formData.baptismDate || ''} onChange={e => setFormData({...formData, baptismDate: e.target.value})} type="date" className="w-full border border-border-main p-2 rounded-lg text-sm bg-bg-main" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Contact Number</label>
              <input value={formData.contactNumber || ''} onChange={e => setFormData({...formData, contactNumber: e.target.value})} type="tel" className="w-full border border-border-main p-2 rounded-lg text-sm bg-bg-main" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Locale</label>
              <select value={formData.locale || ''} onChange={e => setFormData({...formData, locale: e.target.value})} className="w-full border border-border-main p-2 rounded-lg text-sm bg-bg-main">
                {activeLocales.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Address</label>
              <input required value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} type="text" className="w-full border border-border-main p-2 rounded-lg text-sm bg-bg-main" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Status</label>
              <select value={formData.status || 'Active'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border border-border-main p-2 rounded-lg text-sm bg-bg-main">
                <option>Active</option>
                <option>Inactive</option>
                <option>Transferred</option>
                <option>Deceased</option>
              </select>
            </div>

            <div className="pt-4 mt-4 border-t border-border-main">
              <button type="submit" className="w-full bg-[#0A3D91] text-white py-3 rounded-lg font-bold">
                {isEditing ? 'Save Changes' : 'Create Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
