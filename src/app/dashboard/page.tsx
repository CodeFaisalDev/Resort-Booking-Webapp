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

  const handleCancelBooking = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? This action is irreversible.')) return;
    try {
      const res = await fetch(`/api/book?id=${reservationId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert('Your reservation has been canceled successfully and a refund has been simulated.');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to cancel reservation.');
      }
    } catch (err) {
      console.error('Cancel booking error:', err);
      alert('An error occurred while attempting to cancel.');
    }
  };

  const getStayStepIndex = (r: any) => {
    if (r.status === 'CANCELED') return -1;
    const now = Date.now();
    const checkIn = new Date(r.checkIn).getTime();
    const checkOut = new Date(r.checkOut).getTime();
    
    if (r.status === 'PENDING') return 1;
    if (now > checkOut) return 4;
    if (now >= checkIn && now <= checkOut) return 3;
    return 2;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-grow items-center justify-center min-h-[60vh] bg-[#141414]">
        <Loader2 className="h-10 w-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  const userType = (session?.user as any)?.type;
  const userRole = (session?.user as any)?.role;

  return (
    <div className="w-full min-h-screen bg-[#141414] text-[#E5E5E5] pt-24 pb-20 relative overflow-hidden">
      
      {/* Glow Backdrops */}
      <div className="absolute top-[10%] left-[-15%] w-[500px] h-[500px] bg-brand-accent/3 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[30%] right-[-15%] w-[500px] h-[500px] bg-brand-accent/3 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-white/5 pb-8 mb-12 select-none">
          <div>
            <h1 className="font-heading text-3xl sm:text-5xl font-normal tracking-tight text-white">
              {userType === 'staff' && userRole === 'ADMIN' ? 'Hotel Manager Console' : 'Resort Control Panel'}
            </h1>
            <p className="text-[#A0A0A0] text-xs sm:text-sm mt-2">
              Logged in as <span className="text-white font-semibold">{session?.user?.name}</span> ({userRole || 'GUEST'})
            </p>
          </div>
          <Compass className="h-10 w-10 text-brand-accent animate-spin-slow" />
        </div>

        {/* GUEST DASHBOARD */}
        {userType === 'guest' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 border border-white/5 shadow-2xl">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider">Total Stays</span>
                  <span className="text-xl font-bold text-white">{guestData?.length || 0} Reservations</span>
                </div>
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 border border-white/5 shadow-2xl">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider">Confirmed Bookings</span>
                  <span className="text-xl font-bold text-white">
                    {guestData?.filter((r: any) => r.status === 'CONFIRMED').length || 0} Active
                  </span>
                </div>
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 border border-white/5 shadow-2xl">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider">Pending Payments</span>
                  <span className="text-xl font-bold text-white">
                    {guestData?.filter((r: any) => r.status === 'PENDING').length || 0} Invoices
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-8 border border-white/5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4 select-none">
                <h2 className="font-heading text-2xl font-normal text-white">Reservation Statements</h2>
                <div className="text-[10px] text-brand-accent font-bold uppercase tracking-wider bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full w-fit">
                  Standard 7-Day Cancellation Window Enforced
                </div>
              </div>
              
              {guestData?.length === 0 ? (
                <div className="text-center py-12 text-[#8a8a8a] text-sm">
                  No reservation history found. Click 'Book Now' in the navigation bar to start.
                </div>
              ) : (
                <div className="space-y-6">
                  {guestData?.map((r: any) => {
                    const stepIndex = getStayStepIndex(r);
                    const checkInTime = new Date(r.checkIn).getTime();
                    const currentTime = Date.now();
                    const daysToStart = (checkInTime - currentTime) / (1000 * 60 * 60 * 24);
                    const canCancel = daysToStart >= 7 && r.status !== 'CANCELED';
                    
                    return (
                      <div key={r.id} className="bg-[#141414]/60 border border-white/5 p-6 rounded-2xl space-y-6 shadow-md hover:border-white/10 transition-colors">
                        {/* Title and Badge row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold text-white uppercase tracking-wider">{r.room.roomType.name}</h3>
                            <span className="text-xs text-[#8a8a8a] font-semibold">Room {r.room.roomNum} • Floor {r.room.floor}</span>
                          </div>
                          
                          <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              r.status === 'CONFIRMED'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : r.status === 'CANCELED'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
                            }`}>
                              {r.status}
                            </span>
                          </div>
                        </div>

                        {/* Cost & Dates details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-4 border-t border-white/5">
                          <div>
                            <span className="block text-[#8a8a8a] text-[9px] uppercase font-bold tracking-wider mb-1">Check-in</span>
                            <span className="text-white font-semibold">{new Date(r.checkIn).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                          
                          <div>
                            <span className="block text-[#8a8a8a] text-[9px] uppercase font-bold tracking-wider mb-1">Check-out</span>
                            <span className="text-white font-semibold">{new Date(r.checkOut).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>

                          <div>
                            <span className="block text-[#8a8a8a] text-[9px] uppercase font-bold tracking-wider mb-1">Total Settlement</span>
                            <span className="text-brand-accent font-extrabold">${Number(r.totalAmount).toFixed(0)} USD</span>
                          </div>
                        </div>

                        {/* Tracker Stepper */}
                        <div className="bg-[#1D1D1D]/30 border border-white/5 p-4 rounded-xl space-y-4">
                          <span className="block text-[#8a8a8a] text-[9px] uppercase font-bold tracking-wider select-none">Stay Progress Tracker</span>
                          
                          {r.status === 'CANCELED' ? (
                            <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-center gap-2 font-semibold">
                              <span>⚠️</span>
                              <span>This booking was canceled. The refund has been credited back to your account.</span>
                            </div>
                          ) : (
                            <div className="relative pt-2 pb-8">
                              {/* Connector line */}
                              <div className="absolute top-4 left-4 right-4 h-[2px] bg-white/10 -z-10" />
                              <div 
                                className="absolute top-4 left-4 h-[2px] bg-brand-accent -z-10 transition-all duration-500" 
                                style={{ width: `${((Math.max(1, stepIndex) - 1) / 3) * 100}%` }}
                              />
                              
                              <div className="flex justify-between text-center relative z-10">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                                    stepIndex >= 1 ? 'bg-brand-accent border-brand-accent text-white' : 'bg-[#141414] border-white/10 text-[#555]'
                                  }`}>
                                    1
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${stepIndex >= 1 ? 'text-white' : 'text-[#555]'}`}>Booked</span>
                                </div>

                                {/* Step 2 */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                                    stepIndex >= 2 ? 'bg-brand-accent border-brand-accent text-white' : 'bg-[#141414] border-white/10 text-[#555]'
                                  }`}>
                                    2
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${stepIndex >= 2 ? 'text-white' : 'text-[#555]'}`}>Paid</span>
                                </div>

                                {/* Step 3 */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                                    stepIndex >= 3 ? 'bg-brand-accent border-brand-accent text-white' : 'bg-[#141414] border-white/10 text-[#555]'
                                  }`}>
                                    3
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${stepIndex >= 3 ? 'text-white' : 'text-[#555]'}`}>Active Stay</span>
                                </div>

                                {/* Step 4 */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                                    stepIndex >= 4 ? 'bg-brand-accent border-brand-accent text-white' : 'bg-[#141414] border-white/10 text-[#555]'
                                  }`}>
                                    4
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${stepIndex >= 4 ? 'text-white' : 'text-[#555]'}`}>Completed</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions block */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
                          <div>
                            {r.status !== 'CANCELED' && (
                              <span className="text-[10px] text-[#8a8a8a] font-semibold select-none">
                                {daysToStart >= 7 
                                  ? `Eligible for cancellation up to ${Math.floor(daysToStart - 7)} days from now.`
                                  : daysToStart > 0 
                                  ? 'Check-in is in less than 7 days. Booking is locked and non-refundable.'
                                  : 'Stay is current or completed.'
                                }
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-3">
                            {r.status === 'PENDING' && (
                              <button
                                onClick={() => router.push(`/checkout/${r.id}`)}
                                className="bg-brand-accent hover:bg-brand-accent-hover text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-lg transition-colors cursor-pointer"
                              >
                                Settle Invoice
                              </button>
                            )}

                            {canCancel ? (
                              <button
                                onClick={() => handleCancelBooking(r.id)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl transition-colors cursor-pointer"
                              >
                                Cancel Booking
                              </button>
                            ) : r.status !== 'CANCELED' ? (
                              <button
                                disabled
                                className="bg-white/5 text-[#555] border border-white/5 text-[10px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl cursor-not-allowed select-none animate-pulse"
                                title="Cancellation is locked as check-in is less than 7 days away."
                              >
                                Cancellation Locked
                              </button>
                            ) : null}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAFF DASHBOARD */}
        {userType === 'staff' && userRole === 'STAFF' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-6 border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="font-heading text-2xl font-normal text-white">Assigned Operational Tasks</h2>
                <span className="text-[10px] bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Shift Status: Day Shift
                </span>
              </div>

              {staffData?.length === 0 ? (
                <div className="text-center py-12 text-[#8a8a8a] text-sm">
                  No cleaning or repair tasks allocated to your queue.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {staffData?.map((a: any) => (
                    <div key={a.id} className={`p-6 rounded-2xl border ${a.status === 'COMPLETED' ? 'bg-[#141414]/40 border-white/5 opacity-60' : 'bg-[#1A1A1A] border-white/5 shadow-2xl'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white">Room {a.room.roomNum}</h3>
                          <span className="text-xs text-[#8a8a8a] font-medium">{a.room.roomType.name} (Floor {a.room.floor})</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${a.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'}`}>
                          {a.status}
                        </span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <span className="block text-[10px] text-[#8a8a8a] font-bold uppercase mb-0.5">Task Type</span>
                          <span className="text-white font-semibold">{a.taskType}</span>
                        </div>
                        {a.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteTask(a.id)}
                            className="rounded-xl bg-brand-accent px-4 py-2 font-bold uppercase text-[10px] text-white hover:bg-brand-accent-hover transition-all cursor-pointer shadow-lg"
                          >
                            Mark Done & Release
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
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl">
                <span className="block text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-1">Available</span>
                <span className="text-lg sm:text-2xl font-bold text-green-400">{adminData?.stats?.availableRooms} Rooms</span>
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl">
                <span className="block text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-1">Occupied</span>
                <span className="text-lg sm:text-2xl font-bold text-brand-accent">{adminData?.stats?.occupiedRooms} Rooms</span>
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl">
                <span className="block text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-1">Dirty</span>
                <span className="text-lg sm:text-2xl font-bold text-red-400">{adminData?.stats?.dirtyRooms} Rooms</span>
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl">
                <span className="block text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-1">Maintenance</span>
                <span className="text-lg sm:text-2xl font-bold text-blue-400">{adminData?.stats?.maintenanceRooms} Rooms</span>
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl col-span-2 lg:col-span-1">
                <span className="block text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-1">Total Revenue</span>
                <span className="text-lg sm:text-2xl font-bold text-white">${adminData?.stats?.totalRevenue?.toFixed(0)}</span>
              </div>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="flex border-b border-white/5 gap-6 overflow-x-auto select-none">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'rooms' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-[#8a8a8a] hover:text-white'}`}
              >
                Housekeeping Matrix
              </button>
              <button
                onClick={() => setActiveTab('depts')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'depts' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-[#8a8a8a] hover:text-white'}`}
              >
                Departments
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'staff' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-[#8a8a8a] hover:text-white'}`}
              >
                Staff Distribution
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'finance' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-[#8a8a8a] hover:text-white'}`}
              >
                Financial Log
              </button>
              <button
                onClick={() => setActiveTab('audits')}
                className={`pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'audits' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-[#8a8a8a] hover:text-white'}`}
              >
                System Audits
              </button>
            </div>

            {/* 1. ROOMS & HOUSEKEEPING TAB */}
            {activeTab === 'rooms' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                  <h2 className="font-sans text-xl font-bold text-white">Live Housekeeping Matrix</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black">
                          <th className="pb-3">Num</th>
                          <th className="pb-3 px-3">Floor</th>
                          <th className="pb-3 px-3">Room Type</th>
                          <th className="pb-3 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                        {adminData?.rooms?.map((r: any) => (
                          <tr key={r.id}>
                            <td className="py-3 font-bold text-white">Room {r.roomNum}</td>
                            <td className="py-3 px-3 font-semibold">Floor {r.floor}</td>
                            <td className="py-3 px-3">{r.roomType.name}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                r.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                r.status === 'OCCUPIED' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
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
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                  <h2 className="font-sans text-xl font-bold text-white">Allocate Operations Task</h2>
                  {assignMsg && (
                    <div className="rounded-xl bg-[#141414] border border-white/5 p-3.5 text-center text-xs text-brand-accent font-semibold">
                      {assignMsg}
                    </div>
                  )}
                  <form onSubmit={handleAssignTask} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Select Room</label>
                      <select
                        value={assignRoomId}
                        onChange={(e) => setAssignRoomId(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors font-bold"
                      >
                        {hkRooms.map((r: any) => (
                          <option key={r.id} value={r.id} className="bg-[#141414] text-white">
                            Room {r.roomNum} ({r.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Assign Staff</label>
                      <select
                        value={assignStaffId}
                        onChange={(e) => setAssignStaffId(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors font-bold"
                      >
                        {hkStaff.map((s: any) => (
                          <option key={s.id} value={s.id} className="bg-[#141414] text-white">
                            {s.fullName} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Task Type</label>
                      <select
                        value={assignTaskType}
                        onChange={(e) => setAssignTaskType(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors font-bold"
                      >
                        <option value="Turnover Cleaning" className="bg-[#141414] text-white">Turnover Cleaning</option>
                        <option value="Deep Sweep" className="bg-[#141414] text-white">Deep Sweep</option>
                        <option value="Repair" className="bg-[#141414] text-white">Repair & Maintenance</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={assignLoading}
                      className="w-full rounded-xl bg-brand-accent py-3.5 font-bold uppercase tracking-wider text-white hover:bg-brand-accent-hover transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
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
                <div className="lg:col-span-2 bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                  <h2 className="font-sans text-xl font-bold text-white">Resort Departments</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black">
                          <th className="pb-3">Department Name</th>
                          <th className="pb-3 px-3">Manager Name</th>
                          <th className="pb-3 px-3 text-center">Staff Count</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                        {depts.map((d: any) => (
                          <tr key={d.id}>
                            <td className="py-3 font-bold text-white">{d.name}</td>
                            <td className="py-3 px-3 font-semibold">{d.managerName}</td>
                            <td className="py-3 px-3 text-center font-bold text-brand-accent">{d.staffs?.length || 0}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteDept(d.id)}
                                className="text-[#8a8a8a] hover:text-red-400 transition-colors cursor-pointer"
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
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                  <h2 className="font-sans text-xl font-bold text-white">Create Department</h2>
                  {deptMsg && (
                    <div className="rounded-xl bg-[#141414] border border-white/5 p-3.5 text-center text-xs text-brand-accent font-semibold">
                      {deptMsg}
                    </div>
                  )}
                  <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Department Name</label>
                      <input
                        type="text"
                        required
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="e.g. Concierge"
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Manager Name</label>
                      <input
                        type="text"
                        required
                        value={newDeptManager}
                        onChange={(e) => setNewDeptManager(e.target.value)}
                        placeholder="e.g. Frank Ocean"
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-brand-accent py-3.5 font-bold uppercase tracking-wider text-white hover:bg-brand-accent-hover transition-all cursor-pointer shadow-lg"
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
                <div className="lg:col-span-2 bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                  <h2 className="font-sans text-xl font-bold text-white">Staff Distribution</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black">
                          <th className="pb-3">Name</th>
                          <th className="pb-3 px-3">Email Address</th>
                          <th className="pb-3 px-3">Department</th>
                          <th className="pb-3 px-3">Role</th>
                          <th className="pb-3 px-3">Shift</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                        {staffsList.map((s: any) => (
                          <tr key={s.id}>
                            <td className="py-3 font-bold text-white">{s.fullName}</td>
                            <td className="py-3 px-3 font-semibold">{s.email}</td>
                            <td className="py-3 px-3">{s.department?.name || 'Unassigned'}</td>
                            <td className="py-3 px-3 font-bold text-brand-accent">{s.role}</td>
                            <td className="py-3 px-3 font-semibold">{s.shift}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteStaff(s.id)}
                                className="text-[#8a8a8a] hover:text-red-400 transition-colors cursor-pointer"
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
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                  <h2 className="font-sans text-xl font-bold text-white">Register Staff Profile</h2>
                  {staffMsg && (
                    <div className="rounded-xl bg-[#141414] border border-white/5 p-3.5 text-center text-xs text-brand-accent font-semibold">
                      {staffMsg}
                    </div>
                  )}
                  <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="e.g. Jack Harlow"
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Email Address</label>
                      <input
                        type="email"
                        required
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="e.g. jack@luxuryhorizon.com"
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Password</label>
                      <input
                        type="password"
                        required
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Role</label>
                        <select
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value)}
                          className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors font-bold"
                        >
                          <option value="STAFF" className="bg-[#141414] text-white">STAFF</option>
                          <option value="ADMIN" className="bg-[#141414] text-white">ADMIN</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Shift</label>
                        <select
                          value={newStaffShift}
                          onChange={(e) => setNewStaffShift(e.target.value)}
                          className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors font-bold"
                        >
                          <option value="Day" className="bg-[#141414] text-white">Day Shift</option>
                          <option value="Night" className="bg-[#141414] text-white">Night Shift</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#8a8a8a] uppercase mb-1.5 font-bold tracking-wider text-[10px]">Select Department</label>
                      <select
                        value={newStaffDeptId}
                        onChange={(e) => setNewStaffDeptId(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/5 py-3 px-3 text-white outline-none focus:border-brand-accent focus:bg-white/10 transition-colors font-bold"
                      >
                        {depts.map((d: any) => (
                          <option key={d.id} value={d.id} className="bg-[#141414] text-white">
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-brand-accent py-3.5 font-bold uppercase tracking-wider text-white hover:bg-brand-accent-hover transition-all cursor-pointer shadow-lg"
                    >
                      Register Staff
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 4. FINANCE LOG TAB */}
            {activeTab === 'finance' && (
              <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                <h2 className="font-sans text-xl font-bold text-white">Simulated Transactions Log</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black">
                        <th className="pb-3">Guest Name</th>
                        <th className="pb-3 px-3">Email Address</th>
                        <th className="pb-3 px-3">Paid At</th>
                        <th className="pb-3 px-3">Gateway Method</th>
                        <th className="pb-3 px-3">Payment Status</th>
                        <th className="pb-3 px-3 text-right">Amount Settled</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                      {adminData?.payments?.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-3 font-bold text-white">{p.guest.fullName}</td>
                          <td className="py-3 px-3 font-semibold">{p.guest.email}</td>
                          <td className="py-3 px-3 font-semibold">{new Date(p.paidAt).toLocaleString()}</td>
                          <td className="py-3 px-3 font-semibold">{p.method}</td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-brand-accent">${Number(p.amount).toFixed(2)}</td>
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
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                  <h2 className="font-sans text-xl font-bold text-white">Active Resort Metrics</h2>
                  <div className="divide-y divide-white/5 text-xs text-[#A0A0A0] space-y-3">
                    <div className="flex justify-between py-2.5">
                      <span>Registered Guests Count:</span>
                      <span className="font-bold text-white">{adminData?.payments?.length || 0} Accounts</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span>Registered Departments:</span>
                      <span className="font-bold text-white">{depts.length} Offices</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span>Active Staff Members:</span>
                      <span className="font-bold text-white">{staffsList.length} Headcount</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span>Accommodations:</span>
                      <span className="font-bold text-white">{adminData?.stats?.totalRooms} Rooms</span>
                    </div>
                  </div>
                </div>

                {/* Active Reservations summary */}
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                  <h2 className="font-sans text-xl font-bold text-white">Recent Booking Logs</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black">
                          <th className="pb-2">Guest</th>
                          <th className="pb-2 px-2">Room</th>
                          <th className="pb-2 px-2">Status</th>
                          <th className="pb-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                        {adminData?.reservations?.map((res: any) => (
                          <tr key={res.id}>
                            <td className="py-2.5 font-bold text-white">{res.guest.fullName}</td>
                            <td className="py-2.5 px-2 font-semibold">Room {res.room.roomNum}</td>
                            <td className="py-2.5 px-2">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-brand-accent/10 text-brand-accent border border-brand-accent/20 uppercase tracking-wider">
                                {res.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-brand-accent">${Number(res.totalAmount).toFixed(0)}</td>
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
    </div>
  );
}
