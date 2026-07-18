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
  Trash2,
  Clock,
  ShieldAlert,
  LogIn,
  LogOut,
  ChevronRight,
  Info
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
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'rooms' | 'depts' | 'staff' | 'finance' | 'audits'>('overview');

  // Loading & base state data
  const [guestData, setGuestData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Custom modal confirm states & custom toast variables
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [midStayCancelingId, setMidStayCancelingId] = useState<string | null>(null);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMsg(null);
    }, 5000);
  };

  // Administrative bookings desk states
  const [adminBookings, setAdminBookings] = useState<any[]>([]);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'ACTIVE_STAYS'>('ALL');
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<any | null>(null);

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
  const [deptLoading, setDeptLoading] = useState(false);

  // Staff CRUD states
  const [staffsList, setStaffsList] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('STAFF');
  const [newStaffShift, setNewStaffShift] = useState('Day');
  const [newStaffDeptId, setNewStaffDeptId] = useState('');
  const [staffMsg, setStaffMsg] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    if (!session?.user) return;
    if (!silent) setLoading(true);
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

          // Fetch all bookings for the Bookings Desk
          const bkRes = await fetch('/api/admin/bookings');
          const bkData = await bkRes.json();
          setAdminBookings(bkData || []);
        } else {
          const res = await fetch('/api/dashboard/staff');
          const data = await res.json();
          setStaffData(data.assignments || []);
        }
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session?.user?.email]);

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
        await fetchDashboardData(true);
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
    setDeptLoading(true);
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
        showToast('Department created successfully.', 'success');
        await fetchDashboardData(true);
      } else {
        setDeptMsg(`Error: ${data.error}`);
        showToast(data.error || 'Failed to create department.', 'error');
      }
    } catch (err) {
      setDeptMsg('Failed creating department.');
      showToast('Failed to create department.', 'error');
    } finally {
      setDeptLoading(false);
    }
  };

  const executeDeleteDept = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/departments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Department deleted successfully.', 'success');
        setDeletingDeptId(null);
        await fetchDashboardData(true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete department.', 'error');
      }
    } catch (err) {
      console.error('Failed deleting department:', err);
      showToast('Error deleting department.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeDeleteStaff = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Staff member profile deleted.', 'success');
        setDeletingStaffId(null);
        await fetchDashboardData(true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete staff.', 'error');
      }
    } catch (err) {
      console.error('Failed deleting staff:', err);
      showToast('Error deleting staff.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMsg('');
    setStaffLoading(true);
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
        showToast('Staff member registered successfully.', 'success');
        await fetchDashboardData(true);
      } else {
        setStaffMsg(`Error: ${data.error}`);
        showToast(data.error || 'Failed to register staff.', 'error');
      }
    } catch (err) {
      setStaffMsg('Failed creating staff.');
      showToast('Failed to register staff.', 'error');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCompleteTask = async (assignmentId: string) => {
    setActionLoadingId(assignmentId);
    try {
      const res = await fetch('/api/housekeeping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId })
      });
      if (res.ok) {
        showToast('Task marked completed.', 'success');
        await fetchDashboardData(true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to complete task.', 'error');
      }
    } catch (err) {
      console.error('Failed completing task:', err);
      showToast('Error completing task.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelBooking = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await fetch(`/api/book?id=${reservationId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Your reservation has been canceled successfully and a refund has been simulated.', 'success');
        setCancelingId(null);
        await fetchDashboardData(true);
      } else {
        showToast(data.error || 'Failed to cancel reservation.', 'error');
      }
    } catch (err) {
      console.error('Cancel booking error:', err);
      showToast('An error occurred while attempting to cancel.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdminCheckIn = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, action: 'CHECK_IN' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Guest checked in successfully.', 'success');
        await fetchDashboardData(true);
      } else {
        showToast(data.error || 'Failed to check in.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error during check-in.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdminCheckOut = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, action: 'CHECK_OUT' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Guest checked out successfully.', 'success');
        await fetchDashboardData(true);
      } else {
        showToast(data.error || 'Failed to check out.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error during check-out.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdminCancelMidStay = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, action: 'CANCEL_MID_STAY' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Mid-stay cancellation complete! Nights Stayed: ${data.nightsStayed}. Refund: $${Number(data.refundAmount).toFixed(0)} USD`, 'success');
        setMidStayCancelingId(null);
        await fetchDashboardData(true);
      } else {
        showToast(data.error || 'Failed to cancel mid-stay.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error during mid-stay cancellation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStayStepIndex = (r: any) => {
    if (r.status === 'CANCELED') return -1;
    if (r.status === 'PENDING') return 1;
    if (r.room?.status === 'DIRTY') return 4;
    if (r.room?.status === 'OCCUPIED') return 3;
    
    const now = Date.now();
    const checkIn = new Date(r.checkIn).getTime();
    const checkOut = new Date(r.checkOut).getTime();
    
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
                    const canCancel = r.status !== 'CANCELED' && (r.status === 'PENDING' || daysToStart >= 7);
                    
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

                            {cancelingId === r.id ? (
                              <div className="flex items-center gap-2 bg-[#1C1C1C] border border-red-500/30 p-2 rounded-xl">
                                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Confirm Cancel?</span>
                                <button
                                  disabled={actionLoadingId === r.id}
                                  onClick={() => handleCancelBooking(r.id)}
                                  className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                                >
                                  {actionLoadingId === r.id ? (
                                    <>
                                      <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                                      Canceling...
                                    </>
                                  ) : (
                                    'Yes, Cancel'
                                  )}
                                </button>
                                <button
                                  disabled={actionLoadingId === r.id}
                                  onClick={() => setCancelingId(null)}
                                  className="bg-white/10 text-white text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : canCancel ? (
                              <button
                                onClick={() => setCancelingId(r.id)}
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
                            disabled={actionLoadingId === a.id}
                            onClick={() => handleCompleteTask(a.id)}
                            className="rounded-xl bg-brand-accent px-4 py-2 font-bold uppercase text-[10px] text-white hover:bg-brand-accent-hover transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
                          >
                            {actionLoadingId === a.id ? (
                              <>
                                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Completing...
                              </>
                            ) : (
                              'Mark Done & Release'
                            )}
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
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full relative z-10">
            
            {/* Responsive Sticky Side Navigation */}
            <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28 z-20">
              <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-2xl lg:rounded-3xl p-4 md:p-6 border border-white/5 shadow-2xl flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar select-none">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer lg:w-full text-left ${
                    activeTab === 'overview' 
                      ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                      : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Activity className="h-4 w-4 shrink-0" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer lg:w-full text-left ${
                    activeTab === 'bookings' 
                      ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                      : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Bookings Desk</span>
                </button>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer lg:w-full text-left ${
                    activeTab === 'rooms' 
                      ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                      : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Building className="h-4 w-4 shrink-0" />
                  <span>Housekeeping</span>
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer lg:w-full text-left ${
                    activeTab === 'staff' 
                      ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                      : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Staffing</span>
                </button>
                <button
                  onClick={() => setActiveTab('depts')}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer lg:w-full text-left ${
                    activeTab === 'depts' 
                      ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                      : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="h-4 w-4 shrink-0" />
                  <span>Departments</span>
                </button>
                <button
                  onClick={() => setActiveTab('finance')}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer lg:w-full text-left ${
                    activeTab === 'finance' 
                      ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                      : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <DollarSign className="h-4 w-4 shrink-0" />
                  <span>Financial Ledger</span>
                </button>
                <button
                  onClick={() => setActiveTab('audits')}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer lg:w-full text-left ${
                    activeTab === 'audits' 
                      ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                      : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                  <span>System Audits</span>
                </button>
              </div>
            </aside>

            {/* Main Content Pane */}
            <div className="flex-grow w-full min-w-0 space-y-8 animate-fade-in">
              
              {/* 1. OVERVIEW SUB-VIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl flex flex-col justify-between">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-2">Available</span>
                      <span className="text-xl sm:text-2xl font-bold text-green-400">{adminData?.stats?.availableRooms} Rooms</span>
                    </div>
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl flex flex-col justify-between">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-2">Occupied</span>
                      <span className="text-xl sm:text-2xl font-bold text-brand-accent">{adminData?.stats?.occupiedRooms} Rooms</span>
                    </div>
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl flex flex-col justify-between">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-2">Dirty</span>
                      <span className="text-xl sm:text-2xl font-bold text-red-400">{adminData?.stats?.dirtyRooms} Rooms</span>
                    </div>
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl flex flex-col justify-between">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-2">Maintenance</span>
                      <span className="text-xl sm:text-2xl font-bold text-blue-400">{adminData?.stats?.maintenanceRooms} Rooms</span>
                    </div>
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl flex flex-col justify-between col-span-2 lg:col-span-1">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider mb-2">Total Revenue</span>
                      <span className="text-xl sm:text-2xl font-bold text-white">${adminData?.stats?.totalRevenue?.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Room Cleanliness & Occupancy Matrix Map */}
                  <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div>
                        <h2 className="font-heading text-lg font-normal text-white">Interactive Room Board</h2>
                        <p className="text-xs text-[#8a8a8a] mt-1">Live visual map of all resort accommodations status</p>
                      </div>
                      <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-green-400"><span className="h-2.5 w-2.5 bg-green-500/20 border border-green-500 rounded-md inline-block"></span>Available</span>
                        <span className="flex items-center gap-1.5 text-brand-accent"><span className="h-2.5 w-2.5 bg-brand-accent/20 border border-brand-accent rounded-md inline-block"></span>Occupied</span>
                        <span className="flex items-center gap-1.5 text-red-400"><span className="h-2.5 w-2.5 bg-red-500/20 border border-red-500 rounded-md inline-block"></span>Dirty</span>
                        <span className="flex items-center gap-1.5 text-blue-400"><span className="h-2.5 w-2.5 bg-blue-500/20 border border-blue-500 rounded-md inline-block"></span>Repair</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {adminData?.rooms?.map((r: any) => {
                        const statusColor = r.status === 'AVAILABLE' ? 'border-green-500 bg-green-500/5 text-green-400' :
                                            r.status === 'OCCUPIED' ? 'border-brand-accent bg-brand-accent/5 text-brand-accent' :
                                            r.status === 'DIRTY' ? 'border-red-500 bg-red-500/5 text-red-400' :
                                            'border-blue-500 bg-blue-500/5 text-blue-400';
                        return (
                          <div 
                            key={r.id}
                            className={`p-4 rounded-xl border text-center font-bold space-y-1 transition-all hover:scale-105 select-none ${statusColor}`}
                          >
                            <span className="block text-xs uppercase text-[#8a8a8a]">Room</span>
                            <span className="text-xl text-white block">{r.roomNum}</span>
                            <span className="text-[9px] uppercase block tracking-widest truncate">{r.roomType.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* General Analytics & Telemetry Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
                      <h3 className="font-sans text-base font-bold text-white">System Logs & Telemetry</h3>
                      <div className="space-y-3 text-xs text-[#A0A0A0]">
                        <div className="flex justify-between py-2 border-b border-white/5">
                          <span>Database Connectivity:</span>
                          <span className="text-green-400 font-bold">Operational (100% SLA)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5">
                          <span>API Responders Latency:</span>
                          <span className="text-white font-bold">14ms</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5">
                          <span>Node Server Environment:</span>
                          <span className="text-white font-bold">NextJS Production Build</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span>Housekeeping assignments count:</span>
                          <span className="text-brand-accent font-bold">Live Synced</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
                      <h3 className="font-sans text-base font-bold text-white">Recent Activity Summary</h3>
                      <div className="space-y-3 text-xs text-[#A0A0A0]">
                        {adminBookings?.slice(0, 3).map((r: any) => (
                          <div key={r.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div>
                              <span className="text-white font-bold block">{r.guest.fullName}</span>
                              <span className="text-[10px] text-[#8a8a8a]">Room {r.room.roomNum} ({r.room.roomType.name})</span>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider border uppercase ${
                                r.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                r.status === 'PENDING' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {r.status}
                              </span>
                              <span className="block text-[10px] font-bold text-white mt-1">${Number(r.totalAmount).toFixed(0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. BOOKINGS DESK SUB-VIEW */}
              {activeTab === 'bookings' && (
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-4">
                    <div>
                      <h2 className="font-heading text-2xl font-normal text-white">Bookings Desk</h2>
                      <p className="text-xs text-[#8a8a8a] mt-1">Manage guest status, check-in operations, and stay prorating</p>
                    </div>

                    {/* Booking Status Filter Tags */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider select-none">
                      {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELED', 'ACTIVE_STAYS'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setBookingFilterStatus(filter)}
                          className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            bookingFilterStatus === filter 
                              ? 'bg-brand-accent text-white border-brand-accent shadow-md shadow-brand-accent/10'
                              : 'bg-white/5 text-[#8a8a8a] border-white/5 hover:text-white'
                          }`}
                        >
                          {filter.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bookings Master Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black">
                          <th className="pb-3">Guest Profile</th>
                          <th className="pb-3 px-3">Resort / Room</th>
                          <th className="pb-3 px-3">Stay Timeline</th>
                          <th className="pb-3 px-3">Total Cost</th>
                          <th className="pb-3 px-3">Status</th>
                          <th className="pb-3 text-right">Operations Desk</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                        {adminBookings
                          .filter((r) => {
                            if (bookingFilterStatus === 'ALL') return true;
                            if (bookingFilterStatus === 'ACTIVE_STAYS') {
                              const now = new Date().getTime();
                              const cIn = new Date(r.checkIn).getTime();
                              const cOut = new Date(r.checkOut).getTime();
                              return r.status === 'CONFIRMED' && now >= cIn && now <= cOut;
                            }
                            return r.status === bookingFilterStatus;
                          })
                          .map((r) => {
                            const now = new Date().getTime();
                            const checkInTime = new Date(r.checkIn).getTime();
                            const checkOutTime = new Date(r.checkOut).getTime();
                            const isActiveStay = r.status === 'CONFIRMED' && r.room.status === 'OCCUPIED';
                            const isCompletedStay = r.status === 'CONFIRMED' && r.room.status === 'DIRTY';
                            const isPendingCheckIn = (r.status === 'PENDING' || r.status === 'CONFIRMED') && r.room.status !== 'OCCUPIED' && r.room.status !== 'DIRTY' && r.status !== 'CANCELED';
                            
                            return (
                              <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-4">
                                  <span className="font-bold text-white block">{r.guest.fullName}</span>
                                  <span className="text-[10px] text-[#8a8a8a] block">{r.guest.email}</span>
                                  <span className="text-[10px] text-[#8a8a8a] block">{r.guest.phone || 'No phone'}</span>
                                </td>
                                <td className="py-4 px-3">
                                  <span className="font-semibold text-white block">Room {r.room.roomNum}</span>
                                  <span className="text-[10px] text-[#8a8a8a] block truncate max-w-[150px]">{r.room.resort.name}</span>
                                  <span className="text-[9px] uppercase block tracking-wider font-bold text-brand-accent mt-0.5">{r.room.roomType.name}</span>
                                </td>
                                <td className="py-4 px-3 font-semibold">
                                  <span className="block text-white">{new Date(r.checkIn).toLocaleDateString()} - {new Date(r.checkOut).toLocaleDateString()}</span>
                                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#8a8a8a]">
                                    {Math.ceil(Math.abs(checkOutTime - checkInTime) / (1000 * 60 * 60 * 24))} Nights
                                  </span>
                                </td>
                                <td className="py-4 px-3 font-bold text-white">
                                  ${Number(r.totalAmount).toFixed(0)}
                                </td>
                                <td className="py-4 px-3">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                    r.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    r.status === 'PENDING' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}>
                                    {r.status}
                                  </span>
                                  {isActiveStay && (
                                    <span className="block text-[8px] text-green-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1 animate-pulse">
                                      <Clock className="h-2 w-2" /> In-Stay
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 text-right space-y-1.5 shrink-0">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => setSelectedDetailBooking(r)}
                                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#A0A0A0] hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <Info className="h-3 w-3" /> Details
                                    </button>

                                    {cancelingId === r.id && (
                                      <div className="flex items-center gap-1.5 bg-[#1C1C1C] border border-red-500/30 p-1.5 rounded-lg">
                                        <span className="text-[8px] text-red-400 font-bold uppercase tracking-wider">Cancel Stay?</span>
                                        <button
                                          disabled={actionLoadingId === r.id}
                                          onClick={() => handleCancelBooking(r.id)}
                                          className="bg-red-500 text-white text-[8px] font-bold uppercase py-1 px-2 rounded hover:bg-red-600 transition-colors flex items-center justify-center min-w-[32px]"
                                        >
                                          {actionLoadingId === r.id ? (
                                            <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                                          ) : 'Yes'}
                                        </button>
                                        <button
                                          disabled={actionLoadingId === r.id}
                                          onClick={() => setCancelingId(null)}
                                          className="bg-white/10 text-white text-[8px] font-bold uppercase py-1 px-2 rounded hover:bg-white/20 transition-colors"
                                        >
                                          No
                                        </button>
                                      </div>
                                    )}

                                    {midStayCancelingId === r.id && (
                                      <div className="flex items-center gap-1.5 bg-[#1C1C1C] border border-red-500/30 p-1.5 rounded-lg">
                                        <span className="text-[8px] text-red-400 font-bold uppercase tracking-wider">Prorated Refund?</span>
                                        <button
                                          disabled={actionLoadingId === r.id}
                                          onClick={() => handleAdminCancelMidStay(r.id)}
                                          className="bg-red-500 text-white text-[8px] font-bold uppercase py-1 px-2 rounded hover:bg-red-600 transition-colors flex items-center justify-center min-w-[32px]"
                                        >
                                          {actionLoadingId === r.id ? (
                                            <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                                          ) : 'Yes'}
                                        </button>
                                        <button
                                          disabled={actionLoadingId === r.id}
                                          onClick={() => setMidStayCancelingId(null)}
                                          className="bg-white/10 text-white text-[8px] font-bold uppercase py-1 px-2 rounded hover:bg-white/20 transition-colors"
                                        >
                                          No
                                        </button>
                                      </div>
                                    )}

                                    {!cancelingId && !midStayCancelingId && (
                                      <>
                                        {isPendingCheckIn && (
                                          <button 
                                            disabled={actionLoadingId !== null}
                                            onClick={() => handleAdminCheckIn(r.id)}
                                            className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                                          >
                                            {actionLoadingId === r.id ? (
                                              <div className="w-2.5 h-2.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <LogIn className="h-3 w-3" />
                                            )}
                                            {actionLoadingId === r.id ? 'Checking In...' : 'Check In'}
                                          </button>
                                        )}

                                        {isActiveStay && (
                                          <>
                                            <button 
                                              disabled={actionLoadingId !== null}
                                              onClick={() => handleAdminCheckOut(r.id)}
                                              className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                              {actionLoadingId === r.id ? (
                                                <div className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                              ) : (
                                                <LogOut className="h-3 w-3" />
                                              )}
                                              {actionLoadingId === r.id ? 'Checking Out...' : 'Check Out'}
                                            </button>
                                            <button 
                                              disabled={actionLoadingId !== null}
                                              onClick={() => setMidStayCancelingId(r.id)}
                                              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                                              title="Guest checked out in middle of stay. Calculates prorated refund."
                                            >
                                              <ShieldAlert className="h-3 w-3" /> Cancel Stay
                                            </button>
                                          </>
                                        )}

                                        {(r.status === 'PENDING' || (r.status === 'CONFIRMED' && !isActiveStay && !isCompletedStay)) && (
                                          <button 
                                            disabled={actionLoadingId !== null}
                                            onClick={() => setCancelingId(r.id)}
                                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                          >
                                            Cancel Booking
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. HOUSEKEEPING SUB-VIEW */}
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
                          <option value="Room Service" className="bg-[#141414] text-white">Room Service</option>
                          <option value="Laundry Check" className="bg-[#141414] text-white">Laundry Check</option>
                          <option value="Luggage Assistance" className="bg-[#141414] text-white">Luggage Assistance</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={assignLoading}
                        className="w-full rounded-xl bg-brand-accent py-3.5 font-bold uppercase tracking-wider text-white hover:bg-brand-accent-hover transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        {assignLoading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {assignLoading ? 'Assigning...' : 'Assign Housekeeping'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 4. STAFF DISTRIBUTION SUB-VIEW */}
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
                                {deletingStaffId === s.id ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="text-[9px] text-red-400 font-bold uppercase">Confirm?</span>
                                      <button
                                        disabled={actionLoadingId !== null}
                                        onClick={() => executeDeleteStaff(s.id)}
                                        className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1.5 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {actionLoadingId === s.id && (
                                          <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        {actionLoadingId === s.id ? 'Deleting...' : 'Delete'}
                                      </button>
                                      <button
                                        disabled={actionLoadingId !== null}
                                        onClick={() => setDeletingStaffId(null)}
                                        className="bg-white/10 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        No
                                      </button>
                                    </div>
                                ) : (
                                  <button
                                    onClick={() => setDeletingStaffId(s.id)}
                                    className="text-[#8a8a8a] hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
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
                        disabled={staffLoading}
                        className="w-full rounded-xl bg-brand-accent py-3.5 font-bold uppercase tracking-wider text-white hover:bg-brand-accent-hover transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                      >
                        {staffLoading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {staffLoading ? 'Registering...' : 'Register Staff'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 5. DEPARTMENTS SUB-VIEW */}
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
                                {deletingDeptId === d.id ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-[9px] text-red-400 font-bold uppercase">Confirm?</span>
                                    <button
                                      disabled={actionLoadingId !== null}
                                      onClick={() => executeDeleteDept(d.id)}
                                      className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1.5 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {actionLoadingId === d.id && (
                                        <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                                      )}
                                      {actionLoadingId === d.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                    <button
                                      disabled={actionLoadingId !== null}
                                      onClick={() => setDeletingDeptId(null)}
                                      className="bg-white/10 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeletingDeptId(d.id)}
                                    className="text-[#8a8a8a] hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
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
                        disabled={deptLoading}
                        className="w-full rounded-xl bg-brand-accent py-3.5 font-bold uppercase tracking-wider text-white hover:bg-brand-accent-hover transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                      >
                        {deptLoading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {deptLoading ? 'Creating...' : 'Create Department'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 6. FINANCIAL LEDGER SUB-VIEW */}
              {activeTab === 'finance' && (
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
                  <h2 className="font-heading text-2xl font-normal text-white">Financial Transactions Ledger</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black">
                          <th className="pb-3">Guest Profile</th>
                          <th className="pb-3 px-3">Settlement Date</th>
                          <th className="pb-3 px-3">Gateway Method</th>
                          <th className="pb-3 px-3">Status</th>
                          <th className="pb-3 text-right">Amount Settled</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                        {adminBookings
                          .flatMap((r) => r.payments || [])
                          .sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
                          .map((p: any) => (
                            <tr key={p.id} className="hover:bg-white/[0.01]">
                              <td className="py-3">
                                <span className="font-bold text-white block">{p.guest?.fullName || 'Legacy Account'}</span>
                                <span className="text-[10px] text-[#8a8a8a] block">{p.guest?.email || 'N/A'}</span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-[#8a8a8a]">
                                {new Date(p.paidAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 font-semibold text-white">
                                {p.method}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                                  p.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  p.status === 'REFUNDED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-white/5 text-[#8a8a8a] border-white/5'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className={`py-3 px-3 text-right font-bold ${p.status === 'REFUNDED' ? 'text-red-400' : 'text-brand-accent'}`}>
                                {p.status === 'REFUNDED' ? '-' : ''}${Math.abs(Number(p.amount)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. SYSTEM AUDITS SUB-VIEW */}
              {activeTab === 'audits' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                    <h2 className="font-sans text-xl font-bold text-white">System Diagnostics & Database Logs</h2>
                    <div className="divide-y divide-white/5 text-xs text-[#A0A0A0] space-y-3">
                      <div className="flex justify-between py-2.5">
                        <span>Total Room Accommodations:</span>
                        <span className="font-bold text-white">{adminData?.stats?.totalRooms} Rooms</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span>Database Server:</span>
                        <span className="font-bold text-green-400">PostgreSQL (Supabase/Neon Pool)</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span>SSL Health Status:</span>
                        <span className="font-bold text-green-400">Secured (TLS 1.3)</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span>Active Departments Count:</span>
                        <span className="font-bold text-white">{depts.length} Branches</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span>Active System Staff count:</span>
                        <span className="font-bold text-white">{staffsList.length} Active Accounts</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1A1A1A]/80 backdrop-blur-md p-6 rounded-3xl space-y-6 border border-white/5 shadow-2xl">
                    <h2 className="font-sans text-xl font-bold text-white">Live Booking Desk Log Feed</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black">
                            <th className="pb-2">Guest Profile</th>
                            <th className="pb-2 px-2">Assigned Room</th>
                            <th className="pb-2 px-2">Status</th>
                            <th className="pb-2 text-right">Settled Amount</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                          {adminBookings.slice(0, 5).map((res: any) => (
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

            {/* DETAIL MODAL DRAWER FOR SELECTED BOOKING */}
            {selectedDetailBooking && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in text-xs">
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider block mb-1">Reservation Profile</span>
                      <h3 className="text-lg font-bold text-white">ID: {selectedDetailBooking.id}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedDetailBooking(null)}
                      className="text-[#8a8a8a] hover:text-white transition-colors text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[#A0A0A0]">
                    {/* Guest Section */}
                    <div className="space-y-2.5">
                      <span className="block text-[10px] text-white font-bold uppercase tracking-wider">Guest Information</span>
                      <div className="bg-[#141414]/50 p-4 rounded-xl border border-white/5 space-y-1.5">
                        <span className="block text-white font-bold text-sm">{selectedDetailBooking.guest.fullName}</span>
                        <span className="block font-medium">Email: {selectedDetailBooking.guest.email}</span>
                        <span className="block">Phone: {selectedDetailBooking.guest.phone || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Room Section */}
                    <div className="space-y-2.5">
                      <span className="block text-[10px] text-white font-bold uppercase tracking-wider">Room Allocation</span>
                      <div className="bg-[#141414]/50 p-4 rounded-xl border border-white/5 space-y-1.5">
                        <span className="block text-white font-bold text-sm">Room {selectedDetailBooking.room.roomNum}</span>
                        <span className="block font-medium">Type: {selectedDetailBooking.room.roomType.name}</span>
                        <span className="block">Floor: {selectedDetailBooking.room.floor} | Resort: {selectedDetailBooking.room.resort.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Ledger Section */}
                  <div className="space-y-2.5">
                    <span className="block text-[10px] text-white font-bold uppercase tracking-wider">Financial Statement & Ledger</span>
                    <div className="bg-[#141414]/50 p-4 rounded-xl border border-white/5 space-y-2.5">
                      <div className="flex justify-between text-xs py-1 border-b border-white/5">
                        <span>Original Stay Pricing Amount:</span>
                        <span className="text-white font-bold">${Number(selectedDetailBooking.totalAmount).toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span>Assigned Reservation Status:</span>
                        <span className="text-brand-accent font-bold uppercase">{selectedDetailBooking.status}</span>
                      </div>
                      
                      {/* List Payments */}
                      <div className="pt-2">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-[#8a8a8a] mb-2">Simulated Gateway Transactions</span>
                        <div className="space-y-2">
                          {selectedDetailBooking.payments?.map((pay: any) => (
                            <div key={pay.id} className="flex justify-between items-center bg-[#1A1A1A] p-2 rounded-lg border border-white/5">
                              <div>
                                <span className="block text-[10px] text-white font-bold uppercase">{pay.status}</span>
                                <span className="text-[9px] text-[#8a8a8a]">{new Date(pay.paidAt).toLocaleString()} ({pay.method})</span>
                              </div>
                              <span className={`font-bold ${pay.status === 'REFUNDED' ? 'text-red-400' : 'text-brand-accent'}`}>
                                {pay.status === 'REFUNDED' ? '-' : ''}${Math.abs(Number(pay.amount)).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button 
                      onClick={() => setSelectedDetailBooking(null)}
                      className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all cursor-pointer shadow-lg"
                    >
                      Close Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Premium Custom Toast Notification */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-[99999] p-4 rounded-2xl shadow-2xl border backdrop-blur-md max-w-sm transition-all duration-300 animate-slide-up flex items-start gap-3 ${
          toastType === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className={`h-6 w-6 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs ${
            toastType === 'success' ? 'bg-green-500/15' : 'bg-red-500/15'
          }`}>
            {toastType === 'success' ? '✓' : '✕'}
          </div>
          <div className="flex-grow">
            <span className="block font-black text-[10px] uppercase tracking-widest mb-0.5">
              {toastType === 'success' ? 'Operation Success' : 'Request Error'}
            </span>
            <p className="text-xs text-white/95 font-medium">{toastMsg}</p>
          </div>
          <button 
            onClick={() => setToastMsg(null)}
            className="text-white/40 hover:text-white transition-colors text-xs font-bold font-sans self-start ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
