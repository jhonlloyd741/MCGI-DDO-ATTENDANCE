import React, { useState, useRef } from 'react';
import { useStore, Member } from '../store/store';
import QRCode from 'react-qr-code';
import { Plus, Download, Upload, Trash2, Edit, RefreshCw, Archive, FileSpreadsheet, HelpCircle, Info, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export function Members() {
  const { members, locales, addMember, updateMember, deleteMember, restoreMember, hardDeleteMember, importMembers, addAuditLog } = useStore();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
    name: string;
    isPermanent: boolean;
  }>({
    isOpen: false,
    id: null,
    name: '',
    isPermanent: false,
  });
  
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
    setDeleteModal({
      isOpen: true,
      id,
      name,
      isPermanent: false,
    });
  };

  const handleRestore = (id: string, name: string) => {
    restoreMember(id);
    addAuditLog({ user: 'Super Admin', action: `Restored member: ${name}` });
  };

  const handleHardDelete = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      name,
      isPermanent: true,
    });
  };

  const executeDelete = () => {
    if (!deleteModal.id) return;
    if (deleteModal.isPermanent) {
      hardDeleteMember(deleteModal.id);
      addAuditLog({ user: 'Super Admin', action: `Permanently deleted member: ${deleteModal.name}` });
    } else {
      deleteMember(deleteModal.id);
      addAuditLog({ user: 'Super Admin', action: `Soft deleted member: ${deleteModal.name}` });
    }
    setSelectedMember(null);
    setDeleteModal({ isOpen: false, id: null, name: '', isPermanent: false });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(displayedMembers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, `MCGI_Members_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addAuditLog({ user: 'Super Admin', action: 'Exported Member List' });
  };

  const handleDownloadCSVTemplate = () => {
    const headers = [
      'Full Name',
      'Baptism Date',
      'Gender',
      'Contact Number',
      'Locale',
      'Address',
      'Medical Condition',
      'Maintenance Medicine',
      'Status'
    ];
    const sampleRows = [
      ['Juan Dela Cruz', '2015-10-20', 'Male', '09123456789', activeLocales[0]?.name || 'Nabunturan', 'Davao de Oro', 'false', 'false', 'Active'],
      ['Maria Santos', '2018-12-12', 'Female', '09876543210', activeLocales[1]?.name || 'Compostela', 'Davao de Oro', 'true', 'false', 'Active']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mcgi_members_bulk_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog({ user: 'Super Admin', action: 'Downloaded predefined CSV template' });
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
          const normalizedRow: any = {};
          Object.keys(row).forEach(k => {
            const normalizedKey = k.toLowerCase().replace(/[\s_-]/g, '');
            normalizedRow[normalizedKey] = row[k];
          });

          const rowName = normalizedRow.fullname || normalizedRow.name || 'Unknown';
          const rowBaptismDate = normalizedRow.baptismdate || normalizedRow.baptism || '';
          const rowBirthdate = normalizedRow.birthdate || '';
          const rowGender = normalizedRow.gender || 'Male';
          const rowContact = normalizedRow.contactnumber || normalizedRow.contact || normalizedRow.phone || '';
          const rowLocale = normalizedRow.locale || (activeLocales[0]?.name || '');
          const rowAddress = normalizedRow.address || '';
          const rowMedical = normalizedRow.medicalcondition || normalizedRow.medical || false;
          const rowMaintenance = normalizedRow.maintenancemedicine || normalizedRow.maintenance || false;
          const rowStatus = normalizedRow.status || 'Active';

          const isDuplicate = members.some(m => m.fullName.toLowerCase() === rowName.toLowerCase() && m.baptismDate === rowBaptismDate) || 
                              acc.some(m => m.fullName.toLowerCase() === rowName.toLowerCase() && m.baptismDate === rowBaptismDate);
          
          if (!isDuplicate) {
            acc.push({
              id: row.id || uuidv4(),
              fullName: rowName,
              birthdate: rowBirthdate,
              gender: rowGender,
              baptismDate: rowBaptismDate,
              contactNumber: rowContact,
              locale: rowLocale,
              address: rowAddress,
              medicalCondition: rowMedical === true || String(rowMedical).toLowerCase() === 'true',
              maintenanceMedicine: rowMaintenance === true || String(rowMaintenance).toLowerCase() === 'true',
              status: rowStatus,
              registrationDate: normalizedRow.registrationdate || new Date().toISOString(),
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
            <button onClick={() => setShowGuide(!showGuide)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1 transition-colors duration-200 ${showGuide ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40' : 'bg-bg-main text-text-muted border-border-main hover:bg-bg-card'}`}>
              <HelpCircle size={14} />
              <span>CSV Format Guide</span>
            </button>
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

        {showGuide && (
          <div className="mb-4 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl space-y-3 text-xs text-text-main animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 font-bold">
                <Info size={16} />
                <span>Predefined CSV Bulk Upload Format</span>
              </div>
              <button onClick={handleDownloadCSVTemplate} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1.5 transition-colors shadow-sm">
                <Download size={13} />
                <span>Download Predefined CSV Template</span>
              </button>
            </div>
            
            <p className="text-text-muted leading-relaxed">
              To import members in bulk, upload a CSV or Excel file containing the exact columns below. The headers are case-insensitive and allow spaces/underscores. Duplicates are automatically skipped.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-bg-card p-3 rounded-lg border border-border-main font-mono text-[10px]">
              <div>
                <span className="font-bold text-amber-700 dark:text-amber-400">Full Name</span>
                <span className="text-red-500 font-bold ml-0.5">*</span>
                <span className="block text-text-muted">e.g. Juan Dela Cruz</span>
              </div>
              <div>
                <span className="font-bold text-amber-700 dark:text-amber-400">Baptism Date</span>
                <span className="text-red-500 font-bold ml-0.5">*</span>
                <span className="block text-text-muted">YYYY-MM-DD</span>
              </div>
              <div>
                <span className="font-bold text-[#0A3D91] dark:text-blue-400">Gender</span>
                <span className="block text-text-muted">Male or Female</span>
              </div>
              <div>
                <span className="font-bold text-[#0A3D91] dark:text-blue-400">Contact Number</span>
                <span className="block text-text-muted">e.g. 09123456789</span>
              </div>
              <div>
                <span className="font-bold text-[#0A3D91] dark:text-blue-400">Locale</span>
                <span className="block text-text-muted">Match active locale name</span>
              </div>
              <div>
                <span className="font-bold text-[#0A3D91] dark:text-blue-400">Address</span>
                <span className="block text-text-muted">Full home address</span>
              </div>
              <div>
                <span className="font-bold text-[#0A3D91] dark:text-blue-400">Medical Condition</span>
                <span className="block text-text-muted">true / false</span>
              </div>
              <div>
                <span className="font-bold text-[#0A3D91] dark:text-blue-400">Maintenance Medicine</span>
                <span className="block text-text-muted">true / false</span>
              </div>
            </div>
            
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 italic">
              * Required fields. Locales must match the active configured locales under Settings, otherwise they will default to the primary locale.
            </div>
          </div>
        )}

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
                    <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase ${
                      m.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      m.status === 'Inactive' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      m.status === 'Transferred' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {m.status}
                    </span>
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

      {/* Beautiful Deletion Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border-main p-6 space-y-6 transform scale-100 transition-all">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${deleteModal.isPermanent ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main">
                  {deleteModal.isPermanent ? 'Permanently Delete Member' : 'Move Member to Recycle Bin'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Confirm action for <span className="font-bold text-text-main">{deleteModal.name}</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-bg-main rounded-xl border border-border-main text-xs text-text-muted space-y-2 leading-relaxed">
              {deleteModal.isPermanent ? (
                <>
                  <p className="font-semibold text-red-600 dark:text-red-400">⚠️ CRITICAL WARNING:</p>
                  <p>This action is <span className="font-bold uppercase text-red-600 dark:text-red-400">irreversible</span>. It will permanently remove all registration records, attendance history, QR-code associations, and health files from the database.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">NOTICE:</p>
                  <p>The member will be removed from the active directory and sent to the <span className="font-bold">Recycle Bin</span>. You can restore them anytime from there or permanently delete them later.</p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: null, name: '', isPermanent: false })}
                className="px-4 py-2.5 rounded-xl border border-border-main text-xs font-bold text-text-muted hover:bg-bg-main hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  deleteModal.isPermanent 
                    ? 'bg-red-600 hover:bg-red-700 active:scale-[0.98]' 
                    : 'bg-[#0A3D91] hover:bg-[#072d6b] active:scale-[0.98]'
                }`}
              >
                {deleteModal.isPermanent ? 'Yes, Permanently Delete' : 'Yes, Delete Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
