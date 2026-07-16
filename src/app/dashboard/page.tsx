'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Compass, 
  Calendar, 
  User, 
  DollarSign, 
  Layers, 
  CheckCircle, 
  Activity, 
  Plus,
  Loader2,
  Building,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if not signed in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Active sub-tab for Admin
  const [activeTab, setActiveTab] = useState<'rooms' | 'depts' | 'staff' | 'finance' | 'audits'>('rooms');

  // Loading & base state data
  const [guestData, setGuestData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Housekeeping task assign panel variables
  const [hkRooms, setHkRooms] = useState<any[]>([]);
  const [hkStaff, setHkStaff] = useState<any[]>([]);
  const [assignRoomId, setAssignRoomId] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignTaskType, setAssignTaskType] = useState('Turnover Cleaning');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');

  // Department CRUD states
  const [depts, setDepts] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptManager, setNewDeptManager] = useState('');
  const [deptMsg, setDeptMsg] = useState('');

  // Staff CRUD states
  const [staffsList, setStaffsList] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('STAFF');
  const [newStaffShift, setNewStaffShift] = useState('Day');
  const [newStaffDeptId, setNewStaffDeptId] = useState('');
  const [staffMsg, setStaffMsg] = useState('');

  const fetchDashboardData = async () => {
    if (!session?.user) return;
    setLoading(true);
    const userType = (session.user as any).type;
    const userRole = (session.user as any).role;

    try {
      if (userType === 'guest') {
        const res = await fetch('/api/dashboard/guest');
        const data = await res.json();
        setGuestData(data.reservations || []);
      } else if (userType === 'staff') {
        if (userRole === 'ADMIN') {
          const res = await fetch('/api/dashboard/admin');
          const data = await res.json();
          setAdminData(data);
          
          setHkRooms(data.rooms || []);
          setHkStaff(data.staffList || []);
          if (data.rooms && data.rooms.length > 0) setAssignRoomId(data.rooms[0].id);
          if (data.staffList && data.staffList.length > 0) setAssignStaffId(data.staffList[0].id);

          // Fetch Departments list for Tab
          const deptRes = await fetch('/api/admin/departments');
          const deptData = await deptRes.json();
          setDepts(deptData || []);

          // Fetch Staff list for Tab
          const sRes = await fetch('/api/admin/staff');
          const sData = await sRes.json();
          setStaffsList(sData || []);
          if (deptData && deptData.length > 0) {
            setNewStaffDeptId(deptData[0].id);
          }
        } else {
          const res = await fetch('/api/dashboard/staff');
          const data = await res.json();
          setStaffData(data.assignments || []);
        }
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignMsg('');
    setAssignLoading(true);

    try {
      const res = await fetch('/api/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: assignRoomId,
          staffId: assignStaffId,
          taskType: assignTaskType
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAssignMsg('Task assigned successfully.');
        fetchDashboardData();
      } else {
        setAssignMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setAssignMsg('Failed assigning task.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptMsg('');
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName, managerName: newDeptManager })
      });
      const data = await res.json();
      if (res.ok) {
        setDeptMsg('Department created.');
        setNewDeptName('');
        setNewDeptManager('');
        fetchDashboardData();
      } else {
        setDeptMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setDeptMsg('Failed creating department.');
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? All associated staff will be affected.')) return;
    try {
      const res = await fetch(`/api/admin/departments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed deleting department:', err);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMsg('');
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newStaffName,
          email: newStaffEmail,
          password: newStaffPassword,
          role: newStaffRole,
          shift: newStaffShift,
          departmentId: newStaffDeptId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStaffMsg('Staff member registered.');
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffPassword('');
        fetchDashboardData();
      } else {
        setStaffMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setStaffMsg('Failed creating staff.');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff profile?')) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed deleting staff:', err);
    }
  };

  const handleCompleteTask = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/housekeeping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed completing task:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-grow items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
      </div>
    );
  }

  const userType = (session?.user as any)?.type;
  const userRole = (session?.user as any)?.role;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex-grow">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-stone-850 pb-8 mb-12">
        <div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-amber-400">
            Resort Control Panel
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-2">
            Logged in as <span className="text-stone-200 font-semibold">{session?.user?.name}</span> ({userRole || 'GUEST'})
          </p>
        </div>
        <Compass className="h-10 w-10 text-amber-400/80" />
      </div>

      {/* GUEST DASHBOARD */}
      {userType === 'guest' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-effect p-6 rounded-2xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-stone-500 text-[10px] uppercase font-semibold">Total Stays</span>
                <span className="text-xl font-bold text-stone-200">{guestData?.length || 0} Reservations</span>
              </div>
            </div>
            <div className="glass-effect p-6 rounded-2xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-stone-500 text-[10px] uppercase font-semibold">Confirmed Bookings</span>
                <span className="text-xl font-bold text-stone-200">
                  {guestData?.filter((r: any) => r.status === 'CONFIRMED').length || 0} Active
                </span>
              </div>
            </div>
            <div className="glass-effect p-6 rounded-2xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-stone-500 text-[10px] uppercase font-semibold">Pending Payments</span>
                <span className="text-xl font-bold text-stone-200">
                  {guestData?.filter((r: any) => r.status === 'PENDING').length || 0} Invoices
                </span>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-2xl font-bold text-stone-100">Reservation Statements</h2>
            
            {guestData?.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-sm">
                No reservation history found. Click 'Reserve Room' to book.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-850 text-stone-500 uppercase tracking-wider font-semibold">
                      <th className="pb-3 pr-4">Room Type</th>
                      <th className="pb-3 px-4">Room Number</th>
                      <th className="pb-3 px-4">Check-In / Out</th>
                      <th className="pb-3 px-4">Settlement Status</th>
                      <th className="pb-3 px-4">Invoice Amount</th>
                      <th className="pb-3 pl-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-stone-300 divide-y divide-stone-850">
                    {guestData?.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-4 pr-4 font-semibold text-stone-200">{r.room.roomType.name}</td>
                        <td className="py-4 px-4">Room {r.room.roomNum} (Floor {r.room.floor})</td>
                        <td className="py-4 px-4">
                          {new Date(r.checkIn).toLocaleDateString()} - {new Date(r.checkOut).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${r.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-amber-400">${Number(r.totalAmount).toFixed(2)}</td>
                        <td className="py-4 pl-4">
                          {r.status === 'PENDING' && (
                            <button
                              onClick={() => router.push(`/checkout/${r.id}`)}
                              className="rounded-full bg-amber-500 px-4 py-1.5 text-[10px] font-bold text-stone-950 uppercase hover:bg-amber-400 transition-all"
                            >
                              Settle Invoice
                            </button>
                          )}
                          {r.status === 'CONFIRMED' && (
                            <span className="text-[10px] text-stone-500">Paid Receipt Dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAFF DASHBOARD */}
      {userType === 'staff' && userRole === 'STAFF' && (
        <div className="space-y-8 animate-fade-in">
          <div className="glass-effect rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-stone-850 pb-4">
              <h2 className="font-serif text-2xl font-bold text-stone-100">Assigned Operational Tasks</h2>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-bold">
                Shift Status: Day Shift
              </span>
            </div>

            {staffData?.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-sm">
                No cleaning or repair tasks allocated to your queue.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {staffData?.map((a: any) => (
                  <div key={a.id} className={`p-6 rounded-2xl border ${a.status === 'COMPLETED' ? 'bg-stone-950/20 border-stone-850 opacity-60' : 'bg-stone-900/10 border-amber-950/20 shadow-md'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-stone-200">Room {a.room.roomNum}</h3>
                        <span className="text-xs text-stone-500">{a.room.roomType.name} (Floor {a.room.floor})</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${a.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {a.status}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-850 flex justify-between items-center text-xs">
                      <div>
                        <span className="block text-[10px] text-stone-500 uppercase">Task Type</span>
                        <span className="text-stone-300 font-semibold">{a.taskType}</span>
                      </div>
                      {a.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCompleteTask(a.id)}
                          className="rounded-full bg-amber-500 px-4 py-2 font-bold uppercase text-[10px] text-stone-950 hover:bg-amber-400 transition-all"
                        >
                          Mark Done & Release Room
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {userType === 'staff' && userRole === 'ADMIN' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="glass-effect p-4 rounded-xl">
              <span className="block text-stone-500 text-[10px] uppercase font-semibold">Available</span>
              <span className="text-lg sm:text-2xl font-bold text-green-400">{adminData?.stats?.availableRooms} Rooms</span>
            </div>
            <div className="glass-effect p-4 rounded-xl">
              <span className="block text-stone-500 text-[10px] uppercase font-semibold">Occupied</span>
              <span className="text-lg sm:text-2xl font-bold text-amber-400">{adminData?.stats?.occupiedRooms} Rooms</span>
            </div>
            <div className="glass-effect p-4 rounded-xl">
              <span className="block text-stone-500 text-[10px] uppercase font-semibold">Dirty</span>
              <span className="text-lg sm:text-2xl font-bold text-red-400">{adminData?.stats?.dirtyRooms} Rooms</span>
            </div>
            <div className="glass-effect p-4 rounded-xl">
              <span className="block text-stone-500 text-[10px] uppercase font-semibold">Maintenance</span>
              <span className="text-lg sm:text-2xl font-bold text-blue-400">{adminData?.stats?.maintenanceRooms} Rooms</span>
            </div>
            <div className="glass-effect p-4 rounded-xl col-span-2 lg:col-span-1">
              <span className="block text-stone-500 text-[10px] uppercase font-semibold">Total Revenue</span>
              <span className="text-lg sm:text-2xl font-bold text-amber-500">${adminData?.stats?.totalRevenue?.toFixed(0)}</span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-stone-850 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${activeTab === 'rooms' ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              Housekeeping Matrix
            </button>
            <button
              onClick={() => setActiveTab('depts')}
              className={`pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${activeTab === 'depts' ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${activeTab === 'staff' ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              Staff Distribution
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${activeTab === 'finance' ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              Financial Log
            </button>
            <button
              onClick={() => setActiveTab('audits')}
              className={`pb-3 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${activeTab === 'audits' ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              System Audits
            </button>
          </div>

          {/* 1. ROOMS & HOUSEKEEPING TAB */}
          {activeTab === 'rooms' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-effect p-6 rounded-3xl space-y-6">
                <h2 className="font-serif text-xl font-bold text-amber-400">Live Housekeeping Matrix</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-850 text-stone-500 uppercase tracking-wider font-semibold">
                        <th className="pb-3">Num</th>
                        <th className="pb-3 px-3">Floor</th>
                        <th className="pb-3 px-3">Room Type</th>
                        <th className="pb-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone-300 divide-y divide-stone-850">
                      {adminData?.rooms?.map((r: any) => (
                        <tr key={r.id}>
                          <td className="py-3 font-bold text-stone-200">Room {r.roomNum}</td>
                          <td className="py-3 px-3">Floor {r.floor}</td>
                          <td className="py-3 px-3">{r.roomType.name}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                              r.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              r.status === 'OCCUPIED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              r.status === 'DIRTY' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Task Allocator panel */}
              <div className="glass-effect p-6 rounded-3xl space-y-6">
                <h2 className="font-serif text-xl font-bold text-amber-400">Allocate Operations Task</h2>
                {assignMsg && (
                  <div className="rounded-lg bg-stone-900/50 border border-stone-800 p-3 text-center text-xs text-amber-400">
                    {assignMsg}
                  </div>
                )}
                <form onSubmit={handleAssignTask} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Select Room</label>
                    <select
                      value={assignRoomId}
                      onChange={(e) => setAssignRoomId(e.target.value)}
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-850 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    >
                      {hkRooms.map((r: any) => (
                        <option key={r.id} value={r.id} className="bg-stone-900 text-stone-100">
                          Room {r.roomNum} ({r.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Assign Staff</label>
                    <select
                      value={assignStaffId}
                      onChange={(e) => setAssignStaffId(e.target.value)}
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    >
                      {hkStaff.map((s: any) => (
                        <option key={s.id} value={s.id} className="bg-stone-900 text-stone-100">
                          {s.fullName} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Task Type</label>
                    <select
                      value={assignTaskType}
                      onChange={(e) => setAssignTaskType(e.target.value)}
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    >
                      <option value="Turnover Cleaning" className="bg-stone-900 text-stone-100">Turnover Cleaning</option>
                      <option value="Deep Sweep" className="bg-stone-900 text-stone-100">Deep Sweep</option>
                      <option value="Repair" className="bg-stone-900 text-stone-100">Repair & Maintenance</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={assignLoading}
                    className="w-full rounded-full bg-amber-500 py-3 font-semibold uppercase tracking-wider text-stone-955 hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
                  >
                    {assignLoading ? 'Assigning...' : 'Assign Housekeeping'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 2. DEPARTMENTS TAB */}
          {activeTab === 'depts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-effect p-6 rounded-3xl space-y-6">
                <h2 className="font-serif text-xl font-bold text-amber-400">Resort Departments</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-855 text-stone-500 uppercase tracking-wider font-semibold">
                        <th className="pb-3">Department Name</th>
                        <th className="pb-3 px-3">Manager Name</th>
                        <th className="pb-3 px-3 text-center">Staff Count</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone-300 divide-y divide-stone-855">
                      {depts.map((d: any) => (
                        <tr key={d.id}>
                          <td className="py-3 font-semibold text-stone-200">{d.name}</td>
                          <td className="py-3 px-3">{d.managerName}</td>
                          <td className="py-3 px-3 text-center font-bold text-amber-400">{d.staffs?.length || 0}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteDept(d.id)}
                              className="text-stone-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Department Form */}
              <div className="glass-effect p-6 rounded-3xl space-y-6">
                <h2 className="font-serif text-xl font-bold text-amber-400">Create Department</h2>
                {deptMsg && (
                  <div className="rounded-lg bg-stone-900/50 border border-stone-800 p-3 text-center text-xs text-amber-400">
                    {deptMsg}
                  </div>
                )}
                <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Department Name</label>
                    <input
                      type="text"
                      required
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="e.g. Concierge"
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Manager Name</label>
                    <input
                      type="text"
                      required
                      value={newDeptManager}
                      onChange={(e) => setNewDeptManager(e.target.value)}
                      placeholder="e.g. Frank Ocean"
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-amber-500 py-3 font-semibold uppercase tracking-wider text-stone-955 hover:bg-amber-400 transition-all"
                  >
                    Create Department
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3. STAFF DISTRIBUTION TAB */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-effect p-6 rounded-3xl space-y-6">
                <h2 className="font-serif text-xl font-bold text-amber-400">Staff Distribution</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-855 text-stone-500 uppercase tracking-wider font-semibold">
                        <th className="pb-3">Name</th>
                        <th className="pb-3 px-3">Email Address</th>
                        <th className="pb-3 px-3">Department</th>
                        <th className="pb-3 px-3">Role</th>
                        <th className="pb-3 px-3">Shift</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone-300 divide-y divide-stone-855">
                      {staffsList.map((s: any) => (
                        <tr key={s.id}>
                          <td className="py-3 font-semibold text-stone-200">{s.fullName}</td>
                          <td className="py-3 px-3">{s.email}</td>
                          <td className="py-3 px-3">{s.department?.name || 'Unassigned'}</td>
                          <td className="py-3 px-3 font-semibold text-amber-500">{s.role}</td>
                          <td className="py-3 px-3">{s.shift}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteStaff(s.id)}
                              className="text-stone-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Staff Form */}
              <div className="glass-effect p-6 rounded-3xl space-y-6">
                <h2 className="font-serif text-xl font-bold text-amber-400">Register Staff Profile</h2>
                {staffMsg && (
                  <div className="rounded-lg bg-stone-900/50 border border-stone-800 p-3 text-center text-xs text-amber-400">
                    {staffMsg}
                  </div>
                )}
                <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Jack Harlow"
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="e.g. jack@luxuryhorizon.com"
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Password</label>
                    <input
                      type="password"
                      required
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-500 uppercase mb-1 font-semibold">Role</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value)}
                        className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                      >
                        <option value="STAFF" className="bg-stone-900 text-stone-100">STAFF</option>
                        <option value="ADMIN" className="bg-stone-900 text-stone-100">ADMIN</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-stone-500 uppercase mb-1 font-semibold">Shift</label>
                      <select
                        value={newStaffShift}
                        onChange={(e) => setNewStaffShift(e.target.value)}
                        className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                      >
                        <option value="Day" className="bg-stone-900 text-stone-100">Day Shift</option>
                        <option value="Night" className="bg-stone-900 text-stone-100">Night Shift</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-500 uppercase mb-1 font-semibold">Select Department</label>
                    <select
                      value={newStaffDeptId}
                      onChange={(e) => setNewStaffDeptId(e.target.value)}
                      className="w-full rounded-xl bg-stone-900/40 border border-stone-855 py-3 px-3 text-stone-100 outline-none focus:border-amber-500"
                    >
                      {depts.map((d: any) => (
                        <option key={d.id} value={d.id} className="bg-stone-900 text-stone-100">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-amber-500 py-3 font-semibold uppercase tracking-wider text-stone-955 hover:bg-amber-400 transition-all"
                  >
                    Register Staff
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 4. FINANCE LOG TAB */}
          {activeTab === 'finance' && (
            <div className="glass-effect p-6 rounded-3xl space-y-6">
              <h2 className="font-serif text-xl font-bold text-amber-400">Simulated Transactions Log</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-855 text-stone-500 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Guest Name</th>
                      <th className="pb-3 px-3">Email Address</th>
                      <th className="pb-3 px-3">Paid At</th>
                      <th className="pb-3 px-3">Gateway Method</th>
                      <th className="pb-3 px-3">Payment Status</th>
                      <th className="pb-3 px-3 text-right">Amount Settled</th>
                    </tr>
                  </thead>
                  <tbody className="text-stone-300 divide-y divide-stone-855">
                    {adminData?.payments?.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-3 font-semibold text-stone-200">{p.guest.fullName}</td>
                        <td className="py-3 px-3">{p.guest.email}</td>
                        <td className="py-3 px-3">{new Date(p.paidAt).toLocaleString()}</td>
                        <td className="py-3 px-3">{p.method}</td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-400">${Number(p.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. SYSTEM AUDITS TAB */}
          {activeTab === 'audits' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Core Audit Metrics */}
              <div className="glass-effect p-6 rounded-3xl space-y-6">
                <h2 className="font-serif text-xl font-bold text-amber-400">Active Resort Metrics</h2>
                <div className="divide-y divide-stone-855 text-xs text-stone-400 space-y-3">
                  <div className="flex justify-between py-2.5">
                    <span>Registered Guests Count:</span>
                    <span className="font-bold text-stone-200">{adminData?.payments?.length || 0} Accounts</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Registered Departments:</span>
                    <span className="font-bold text-stone-200">{depts.length} Offices</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Active Staff Members:</span>
                    <span className="font-bold text-stone-200">{staffsList.length} Headcount</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Accommodations:</span>
                    <span className="font-bold text-stone-200">{adminData?.stats?.totalRooms} Rooms</span>
                  </div>
                </div>
              </div>

              {/* Active Reservations summary */}
              <div className="glass-effect p-6 rounded-3xl space-y-6">
                <h2 className="font-serif text-xl font-bold text-amber-400">Recent Booking Logs</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-855 text-stone-500 uppercase tracking-wider font-semibold">
                        <th className="pb-2">Guest</th>
                        <th className="pb-2 px-2">Room</th>
                        <th className="pb-2 px-2">Status</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone-300 divide-y divide-stone-855">
                      {adminData?.reservations?.map((res: any) => (
                        <tr key={res.id}>
                          <td className="py-2.5 font-semibold text-stone-200">{res.guest.fullName}</td>
                          <td className="py-2.5 px-2">Room {res.room.roomNum}</td>
                          <td className="py-2.5 px-2">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {res.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-bold text-amber-400">${Number(res.totalAmount).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
