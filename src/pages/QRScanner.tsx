import React, { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useStore } from '../store/store';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function QRScanner() {
  const gatheringTypes = useStore(state => state.gatheringTypes).filter(g => g.status === 'Open');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [gathering, setGathering] = useState(gatheringTypes.length > 0 ? gatheringTypes[0].name : '');
  const [batch, setBatch] = useState('Live');
  
  const members = useStore(state => state.members);
  const addAttendance = useStore(state => state.addAttendance);

  React.useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
    
    scanner.render((decodedText) => {
      setScanResult(decodedText);
      handleScan(decodedText);
      scanner.pause(true);
      setTimeout(() => scanner.resume(), 3000);
    }, (err) => {
      // ignore
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [gathering, batch, members]);

  const handleScan = (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) {
      const attendance = {
        id: uuidv4(),
        memberId: member.id,
        fullName: member.fullName,
        locale: member.locale,
        gatheringType: gathering,
        batch: batch,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm:ss'),
        healthDeclaration: true, // assume true for QR scan
      };
      addAttendance(attendance);
      alert(`Attendance recorded for ${member.fullName}`);
    } else {
      alert("Member not found! ID: " + id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-main">
        <h2 className="text-xl font-bold mb-6">QR Code Scanner</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
             <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Gathering Type</label>
             <select value={gathering} onChange={e => setGathering(e.target.value)} className="w-full border border-border-main p-3 rounded-xl text-sm bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20">
                {gatheringTypes.map(g => (
                  <option key={g.id}>{g.name}</option>
                ))}
             </select>
          </div>
          <div className="space-y-2">
             <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Batch</label>
             <select value={batch} onChange={e => setBatch(e.target.value)} className="w-full border border-border-main p-3 rounded-xl text-sm bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20">
                <option>Live</option>
                <option>2nd Batch</option>
                <option>3rd Batch</option>
             </select>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border-2 border-border-main bg-black flex items-center justify-center min-h-[400px]">
          <div id="reader" className="w-full h-full"></div>
        </div>
        
        {scanResult && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 text-center font-bold">
            Last Scanned: {scanResult}
          </div>
        )}
      </div>
    </div>
  );
}
