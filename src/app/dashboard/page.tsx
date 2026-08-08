'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Compass, 
  Calendar, 
  User, 
  DollarSign, 
  Layers, 
  CheckCircle, 
  Activity, 
  Plus,
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
  ChevronLeft,
  Info,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Menu,
  Sparkles,
  RefreshCw,
  Edit,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  DashboardTableSkeleton, 
  KPIGridSkeleton, 
  RoomsBoardSkeleton, 
  ResortGridSkeleton, 
  AuditLogsSkeleton 
} from '@/components/SkeletonLoaders';
import { dashboardCache } from '@/lib/dashboardCache';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Redirect if not signed in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Sidebar collapse & Mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Active sub-tabs
  const urlTab = searchParams?.get('tab');
  const adminTabs = ['overview', 'bookings', 'rooms', 'depts', 'staff', 'roles', 'services', 'finance', 'audits', 'resorts'];
  const initialAdminTab = (urlTab && adminTabs.includes(urlTab)) ? (urlTab as any) : 'overview';
  const initialGuestTab = (urlTab && ['reservations', 'favorites', 'profile'].includes(urlTab)) ? (urlTab as any) : 'reservations';

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'rooms' | 'depts' | 'staff' | 'roles' | 'services' | 'finance' | 'audits' | 'resorts'>(initialAdminTab);
  const [guestTab, setGuestTab] = useState<'reservations' | 'favorites' | 'profile'>(initialGuestTab);

  // Synchronize activeTab with URL
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  };

  const handleGuestTabChange = (tab: any) => {
    setGuestTab(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  };

  // Loading & base state data
  const [guestData, setGuestData] = useState<{ reservations: any[]; favorites: any[] }>({ reservations: [], favorites: [] });
  const [adminData, setAdminData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Search & Filter states across all tabs
  const [overviewRoomFilter, setOverviewRoomFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE'>('ALL');
  const [overviewRoomSearch, setOverviewRoomSearch] = useState('');
  const [overviewResortFilter, setOverviewResortFilter] = useState('ALL');
  const [overviewBookingSearch, setOverviewBookingSearch] = useState('');
  const [overviewBookingPage, setOverviewBookingPage] = useState(1);
  const [overviewRoomPage, setOverviewRoomPage] = useState(1);

  // Bookings Desk filters
  const [adminBookings, setAdminBookings] = useState<any[]>([]);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'ACTIVE_STAYS'>('ALL');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingResortFilter, setBookingResortFilter] = useState('ALL');
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingPageSize, setBookingPageSize] = useState(8);
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<any | null>(null);

  // Housekeeping filters
  const [hkRooms, setHkRooms] = useState<any[]>([]);
  const [hkStaff, setHkStaff] = useState<any[]>([]);
  const [hkRoomFilter, setHkRoomFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE'>('ALL');
  const [hkSearchQuery, setHkSearchQuery] = useState('');
  const [hkPage, setHkPage] = useState(1);
  const [hkPageSize, setHkPageSize] = useState(8);

  // Housekeeping task assign modal
  const [assignRoomId, setAssignRoomId] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignTaskType, setAssignTaskType] = useState('Turnover Cleaning');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Staffing filters & states
  const [staffsList, setStaffsList] = useState<any[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('ALL');
  const [staffShiftFilter, setStaffShiftFilter] = useState<string>('ALL');
  const [staffDeptFilter, setStaffDeptFilter] = useState<string>('ALL');
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(8);

  // Staff CRUD states
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('STAFF');
  const [newStaffShift, setNewStaffShift] = useState('Day');
  const [newStaffDeptId, setNewStaffDeptId] = useState('');
  const [staffMsg, setStaffMsg] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  // Departments filters & states
  const [depts, setDepts] = useState<any[]>([]);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [deptPage, setDeptPage] = useState(1);
  const [deptPageSize, setDeptPageSize] = useState(8);

  // Roles filters & states
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>(['HOUSEKEEPING']);
  const [roleMsg, setRoleMsg] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);

  // Services catalog states
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Wellness & Spa');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [serviceMsg, setServiceMsg] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [servicePage, setServicePage] = useState(1);
  const [servicePageSize, setServicePageSize] = useState(8);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  // Department CRUD states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptManager, setNewDeptManager] = useState('');
  const [deptMsg, setDeptMsg] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);

  // Finance filters & states
  const [financeSearchQuery, setFinanceSearchQuery] = useState('');
  const [financeStatusFilter, setFinanceStatusFilter] = useState<string>('ALL');
  const [financePage, setFinancePage] = useState(1);
  const [financePageSize, setFinancePageSize] = useState(8);

  // Audit logs filters & states
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);

  // Resorts filters & states
  const [resortsList, setResortsList] = useState<any[]>([]);
  const [resortSearchQuery, setResortSearchQuery] = useState('');
  const [resortRatingFilter, setResortRatingFilter] = useState<number>(0);
  const [resortPage, setResortPage] = useState(1);
  const [resortPageSize, setResortPageSize] = useState(6);

  // Confirmation Modals
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmCancelBooking, setConfirmCancelBooking] = useState<any | null>(null);
  const [cancelAgreed, setCancelAgreed] = useState(false);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [deletingResortId, setDeletingResortId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMsg(null);
    }, 5000);
  };

  // Reset pagination when switching tabs
  useEffect(() => {
    setOverviewBookingPage(1);
    setOverviewRoomPage(1);
    setBookingPage(1);
    setHkPage(1);
    setStaffPage(1);
    setDeptPage(1);
    setFinancePage(1);
    setAuditPage(1);
    setResortPage(1);
  }, [activeTab]);

  // ─── CACHED LAZY DATA FETCHERS ─────────────────────────────────────────────

  // Overview: Stats + Rooms
  const fetchOverviewData = useCallback(async (force = false) => {
    if (!session?.user) return;
    if (!force && dashboardCache.has('overview')) {
      const cached = dashboardCache.get('overview');
      setAdminData(cached);
      setHkRooms(cached.rooms || []);
      setHkStaff(cached.staffList || []);
      return;
    }

    if (!adminData) setLoading(true);
    try {
      const res = await fetch('/api/dashboard/admin');
      const data = await res.json();
      setAdminData(data);
      setHkRooms(data.rooms || []);
      setHkStaff(data.staffList || []);
      if (data.rooms?.length > 0) setAssignRoomId(data.rooms[0].id);
      if (data.staffList?.length > 0) setAssignStaffId(data.staffList[0].id);
      dashboardCache.set('overview', data);
    } catch (e) {
      console.error('Error loading overview data:', e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, adminData]);

  // Bookings Desk
  const fetchBookingsData = useCallback(async (force = false) => {
    if (!force && dashboardCache.has('bookings')) {
      const cached = dashboardCache.get('bookings');
      setAdminBookings(Array.isArray(cached) ? cached : []);
      return;
    }
    setTabLoading(true);
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      const valid = Array.isArray(data) ? data : [];
      setAdminBookings(valid);
      if (Array.isArray(data)) dashboardCache.set('bookings', valid);
    } catch (e) { console.error(e); setAdminBookings([]); }
    finally { setTabLoading(false); }
  }, []);

  // Departments
  const fetchDeptsData = useCallback(async (force = false) => {
    if (!force && dashboardCache.has('depts')) {
      const cached = dashboardCache.get('depts');
      setDepts(Array.isArray(cached) ? cached : []);
      return;
    }
    setTabLoading(true);
    try {
      const res = await fetch('/api/admin/departments');
      const data = await res.json();
      const valid = Array.isArray(data) ? data : [];
      setDepts(valid);
      if (valid.length > 0) setNewStaffDeptId(valid[0].id);
      if (Array.isArray(data)) dashboardCache.set('depts', valid);
    } catch (e) { console.error(e); setDepts([]); }
    finally { setTabLoading(false); }
  }, []);

  // Roles
  const fetchRolesData = useCallback(async (force = false) => {
    setTabLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      setRolesList(Array.isArray(data?.roles) ? data.roles : []);
    } catch (e) { console.error(e); setRolesList([]); }
    finally { setTabLoading(false); }
  }, []);

  // Services
  const fetchServicesData = useCallback(async (force = false) => {
    setTabLoading(true);
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      setServicesList(Array.isArray(data?.services) ? data.services : []);
    } catch (e) { console.error(e); setServicesList([]); }
    finally { setTabLoading(false); }
  }, []);

  // Staffing
  const fetchStaffData = useCallback(async (force = false) => {
    if (!force && dashboardCache.has('staff')) {
      const cached = dashboardCache.get('staff');
      setStaffsList(Array.isArray(cached) ? cached : []);
      return;
    }
    setTabLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch('/api/admin/staff'),
        depts.length === 0 ? fetch('/api/admin/departments') : Promise.resolve(null)
      ]);
      const sData = await sRes.json();
      const validStaff = Array.isArray(sData) ? sData : [];
      setStaffsList(validStaff);
      if (Array.isArray(sData)) dashboardCache.set('staff', validStaff);
      if (dRes) {
        const dData = await dRes.json();
        const validDepts = Array.isArray(dData) ? dData : [];
        setDepts(validDepts);
        if (Array.isArray(dData)) dashboardCache.set('depts', validDepts);
        if (validDepts.length > 0) setNewStaffDeptId(validDepts[0].id);
      }
    } catch (e) { console.error(e); setStaffsList([]); }
    finally { setTabLoading(false); }
  }, [depts.length]);

  // Finance
  const fetchFinanceData = useCallback(async (force = false) => {
    if (!dashboardCache.has('bookings') || force) {
      await fetchBookingsData(force);
    }
    dashboardCache.set('finance', true);
  }, [fetchBookingsData]);

  // Resorts Properties
  const fetchResortsData = useCallback(async (force = false) => {
    if (!force && dashboardCache.has('resorts')) {
      setResortsList(dashboardCache.get('resorts') || []);
      return;
    }
    setTabLoading(true);
    try {
      const res = await fetch('/api/resorts?limit=100');
      const data = await res.json();
      const list = data.resorts || [];
      setResortsList(list);
      dashboardCache.set('resorts', list);
    } catch (e) { console.error(e); }
    finally { setTabLoading(false); }
  }, []);

  // Dashboard Data Switcher
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!session?.user) return;
    const userType = (session.user as any).type;
    const userRole = (session.user as any).role;
    try {
      if (userType === 'guest' || userRole === 'GUEST') {
        if (!silent) setLoading(true);
        const res = await fetch('/api/dashboard/guest');
        const data = await res.json();
        setGuestData({
          reservations: data.reservations || [],
          favorites: data.favorites || []
        });
      } else if (userType === 'staff') {
        if (userRole === 'ADMIN') {
          await fetchOverviewData(silent);
        } else {
          if (!silent) setLoading(true);
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
  }, [session?.user?.email, fetchOverviewData]);

  // Initial load
  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session?.user?.email]);

  // Per-tab lazy load on tab switch
  useEffect(() => {
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'ADMIN') return;
    if (activeTab === 'overview') fetchOverviewData();
    if (activeTab === 'bookings') fetchBookingsData();
    if (activeTab === 'staff') fetchStaffData();
    if (activeTab === 'roles') fetchRolesData();
    if (activeTab === 'depts') fetchDeptsData();
    if (activeTab === 'services') fetchServicesData();
    if (activeTab === 'finance') fetchFinanceData();
    if (activeTab === 'resorts') fetchResortsData();
  }, [activeTab]);

  // Manual Refresh Active Tab Data
  const refreshActiveTab = async () => {
    showToast('Refreshing live telemetry data...', 'success');
    if (activeTab === 'overview') await fetchOverviewData(true);
    else if (activeTab === 'bookings') await fetchBookingsData(true);
    else if (activeTab === 'rooms') await fetchOverviewData(true);
    else if (activeTab === 'staff') await fetchStaffData(true);
    else if (activeTab === 'roles') await fetchRolesData(true);
    else if (activeTab === 'depts') await fetchDeptsData(true);
    else if (activeTab === 'services') await fetchServicesData(true);
    else if (activeTab === 'finance') await fetchFinanceData(true);
    else if (activeTab === 'resorts') await fetchResortsData(true);
  };

  // ─── ACTION HANDLERS ──────────────────────────────────────────────────────
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignMsg('');
    setAssignLoading(true);
    try {
      const res = await fetch('/api/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: assignRoomId, staffId: assignStaffId, taskType: assignTaskType })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Task assigned successfully.', 'success');
        setAssignModalOpen(false);
        dashboardCache.invalidate('overview');
        await fetchOverviewData(true);
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast('Failed assigning task.', 'error');
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
        showToast('Department created successfully.', 'success');
        setNewDeptName('');
        setNewDeptManager('');
        setDeptModalOpen(false);
        dashboardCache.invalidate('depts');
        await fetchDeptsData(true);
      } else {
        showToast(data.error || 'Failed to create department.', 'error');
      }
    } catch (err) {
      showToast('Failed creating department.', 'error');
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
        dashboardCache.invalidate('depts');
        await fetchDeptsData(true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete department.', 'error');
      }
    } catch (err) {
      showToast('Error deleting department.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleLoading(true);
    setRoleMsg('');
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc,
          permissions: newRolePermissions
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Dynamic role created successfully!', 'success');
        setNewRoleName('');
        setNewRoleDesc('');
        setRoleModalOpen(false);
        await fetchRolesData(true);
      } else {
        setRoleMsg(data.error || 'Failed to create role.');
      }
    } catch (err) {
      setRoleMsg('Error creating role.');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/roles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Role deleted successfully.', 'success');
        await fetchRolesData(true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed deleting role.', 'error');
      }
    } catch (err) {
      showToast('Error deleting role.', 'error');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceLoading(true);
    setServiceMsg('');
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newServiceName,
          category: newServiceCategory,
          price: newServicePrice
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Service added successfully!', 'success');
        setNewServiceName('');
        setNewServicePrice('');
        setServiceModalOpen(false);
        await fetchServicesData(true);
      } else {
        setServiceMsg(data.error || 'Failed to create service.');
      }
    } catch (err) {
      setServiceMsg('Error creating service.');
    } finally {
      setServiceLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Service removed.', 'success');
        await fetchServicesData(true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed deleting service.', 'error');
      }
    } catch (err) {
      showToast('Error deleting service.', 'error');
    }
  };

  const exportBookingsCSV = () => {
    if (!adminBookings || adminBookings.length === 0) return;
    const headers = ["Booking ID", "Guest Name", "Resort", "Room", "Check In", "Check Out", "Status", "Amount"];
    const rows = adminBookings.map(b => [
      b.id,
      `"${b.guestName || b.guest?.fullName || ''}"`,
      `"${b.resortName || b.room?.resort?.name || ''}"`,
      b.roomNum || b.room?.roomNum || '',
      b.checkIn,
      b.checkOut,
      b.status,
      b.totalAmount
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFinanceCSV = () => {
    const payments = adminData?.payments || [];
    if (payments.length === 0) return;
    const headers = ["Payment ID", "Reservation ID", "Guest Name", "Amount", "Method", "Status", "Paid At"];
    const rows = payments.map((p: any) => [
      p.id,
      p.reservationId,
      `"${p.guestName || p.guest?.fullName || ''}"`,
      p.amount,
      `"${p.method}"`,
      p.status,
      p.paidAt || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finance_payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMsg('');
    setStaffLoading(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          password: newStaffPassword,
          role: newStaffRole,
          shift: newStaffShift,
          departmentId: newStaffDeptId
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Staff registered successfully.', 'success');
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffPassword('');
        setStaffModalOpen(false);
        dashboardCache.invalidate('staff');
        await fetchStaffData(true);
      } else {
        showToast(data.error || 'Failed to register staff.', 'error');
      }
    } catch (err) {
      showToast('Failed creating staff.', 'error');
    } finally {
      setStaffLoading(false);
    }
  };

  const executeDeleteStaff = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Staff member deleted.', 'success');
        setDeletingStaffId(null);
        dashboardCache.invalidate('staff');
        await fetchStaffData(true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete staff.', 'error');
      }
    } catch (err) {
      showToast('Error deleting staff.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeDeleteResort = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/resorts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Resort deleted.', 'success');
        setDeletingResortId(null);
        dashboardCache.invalidate('resorts');
        await fetchResortsData(true);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete resort.', 'error');
      }
    } catch (err) {
      showToast('Error deleting resort.', 'error');
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
      if (res.ok) {
        showToast('Guest checked in successfully.', 'success');
        dashboardCache.invalidate('overview');
        dashboardCache.invalidate('bookings');
        await fetchOverviewData(true);
        await fetchBookingsData(true);
      }
    } catch (err) { showToast('Error during check-in.', 'error'); }
    finally { setActionLoadingId(null); }
  };

  const handleAdminCheckOut = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, action: 'CHECK_OUT' })
      });
      if (res.ok) {
        showToast('Guest checked out successfully.', 'success');
        dashboardCache.invalidate('overview');
        dashboardCache.invalidate('bookings');
        await fetchOverviewData(true);
        await fetchBookingsData(true);
      }
    } catch (err) { showToast('Error during check-out.', 'error'); }
    finally { setActionLoadingId(null); }
  };

  const handleCancelBooking = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await fetch(`/api/book?id=${reservationId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Reservation canceled successfully.', 'success');
        setCancelingId(null);
        dashboardCache.invalidate('overview');
        dashboardCache.invalidate('bookings');
        await fetchDashboardData(true);
        if (activeTab === 'overview') await fetchOverviewData(true);
        if (activeTab === 'bookings') await fetchBookingsData(true);
      } else {
        showToast(data.error || 'Failed to cancel reservation.', 'error');
      }
    } catch (err) {
      showToast('Error canceling reservation.', 'error');
    } finally {
      setActionLoadingId(null);
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
        showToast('Task completed.', 'success');
        dashboardCache.invalidate('overview');
        await fetchOverviewData(true);
      }
    } catch (err) { showToast('Error completing task.', 'error'); }
    finally { setActionLoadingId(null); }
  };

  // ─── FILTERED & PAGINATED DATA COMPUTATIONS ────────────────────────────────

  // Overview: Grouped rooms & filtered rooms
  const filteredOverviewRooms = useMemo(() => {
    const rooms = adminData?.rooms || [];
    return rooms.filter((r: any) => {
      const matchesStatus = overviewRoomFilter === 'ALL' || r.status === overviewRoomFilter;
      const matchesSearch = !overviewRoomSearch || r.roomNum.toLowerCase().includes(overviewRoomSearch.toLowerCase()) || r.roomType?.name?.toLowerCase().includes(overviewRoomSearch.toLowerCase());
      const matchesResort = overviewResortFilter === 'ALL' || r.resortId === overviewResortFilter;
      return matchesStatus && matchesSearch && matchesResort;
    });
  }, [adminData?.rooms, overviewRoomFilter, overviewRoomSearch, overviewResortFilter]);

  const overviewRoomPageSize = 16;
  const totalOverviewRoomPages = Math.ceil(filteredOverviewRooms.length / overviewRoomPageSize) || 1;
  const paginatedOverviewRooms = useMemo(() => {
    return filteredOverviewRooms.slice((overviewRoomPage - 1) * overviewRoomPageSize, overviewRoomPage * overviewRoomPageSize);
  }, [filteredOverviewRooms, overviewRoomPage]);

  // Bookings Desk: Filtered & Paginated
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(adminBookings)) return [];
    return adminBookings.filter((r) => {
      const matchesStatus = bookingFilterStatus === 'ALL' ? true :
        bookingFilterStatus === 'ACTIVE_STAYS' ? (r.status === 'CONFIRMED' && r.room?.status === 'OCCUPIED') :
        r.status === bookingFilterStatus;
      const q = bookingSearchQuery.toLowerCase();
      const matchesSearch = !q || r.guest?.fullName?.toLowerCase().includes(q) || r.guest?.email?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q);
      const matchesResort = bookingResortFilter === 'ALL' || r.room?.resortId === bookingResortFilter;
      return matchesStatus && matchesSearch && matchesResort;
    });
  }, [adminBookings, bookingFilterStatus, bookingSearchQuery, bookingResortFilter]);

  const totalBookingPages = Math.ceil(filteredBookings.length / bookingPageSize) || 1;
  const paginatedBookings = useMemo(() => {
    return filteredBookings.slice((bookingPage - 1) * bookingPageSize, bookingPage * bookingPageSize);
  }, [filteredBookings, bookingPage, bookingPageSize]);

  // Housekeeping: Filtered & Paginated
  const filteredHkRooms = useMemo(() => {
    if (!Array.isArray(hkRooms)) return [];
    return hkRooms.filter((r) => {
      const matchesStatus = hkRoomFilter === 'ALL' || r.status === hkRoomFilter;
      const q = hkSearchQuery.toLowerCase();
      const matchesSearch = !q || r.roomNum?.toLowerCase().includes(q) || r.roomType?.name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [hkRooms, hkRoomFilter, hkSearchQuery]);

  const totalHkPages = Math.ceil(filteredHkRooms.length / hkPageSize) || 1;
  const paginatedHkRooms = useMemo(() => {
    return filteredHkRooms.slice((hkPage - 1) * hkPageSize, hkPage * hkPageSize);
  }, [filteredHkRooms, hkPage, hkPageSize]);

  // Staffing: Filtered & Paginated
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staffsList)) return [];
    return staffsList.filter((s) => {
      const q = staffSearchQuery.toLowerCase();
      const matchesSearch = !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
      const matchesRole = staffRoleFilter === 'ALL' || s.role === staffRoleFilter;
      const matchesShift = staffShiftFilter === 'ALL' || s.shift === staffShiftFilter;
      const matchesDept = staffDeptFilter === 'ALL' || s.departmentId === staffDeptFilter;
      return matchesSearch && matchesRole && matchesShift && matchesDept;
    });
  }, [staffsList, staffSearchQuery, staffRoleFilter, staffShiftFilter, staffDeptFilter]);

  const totalStaffPages = Math.ceil(filteredStaff.length / staffPageSize) || 1;
  const paginatedStaff = useMemo(() => {
    return filteredStaff.slice((staffPage - 1) * staffPageSize, staffPage * staffPageSize);
  }, [filteredStaff, staffPage, staffPageSize]);

  // Departments: Filtered & Paginated
  const filteredDepts = useMemo(() => {
    if (!Array.isArray(depts)) return [];
    return depts.filter((d) => {
      const q = deptSearchQuery.toLowerCase();
      return !q || d.name?.toLowerCase().includes(q) || d.managerName?.toLowerCase().includes(q);
    });
  }, [depts, deptSearchQuery]);

  const totalDeptPages = Math.ceil(filteredDepts.length / deptPageSize) || 1;
  const paginatedDepts = useMemo(() => {
    return filteredDepts.slice((deptPage - 1) * deptPageSize, deptPage * deptPageSize);
  }, [filteredDepts, deptPage, deptPageSize]);

  // Finance: Filtered & Paginated Payments
  const allPayments = useMemo(() => {
    if (!Array.isArray(adminBookings)) return [];
    return adminBookings
      .flatMap((r) => (r.payments || []).map((p: any) => ({ ...p, booking: r })))
      .sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }, [adminBookings]);

  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      const q = financeSearchQuery.toLowerCase();
      const matchesSearch = !q || p.stripeId?.toLowerCase().includes(q) || p.booking?.guest?.fullName?.toLowerCase().includes(q);
      const matchesStatus = financeStatusFilter === 'ALL' || p.status === financeStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allPayments, financeSearchQuery, financeStatusFilter]);

  const totalFinancePages = Math.ceil(filteredPayments.length / financePageSize) || 1;
  const paginatedPayments = useMemo(() => {
    return filteredPayments.slice((financePage - 1) * financePageSize, financePage * financePageSize);
  }, [filteredPayments, financePage, financePageSize]);

  // Audits Logs: Derived Telemetry Trail
  const auditLogs = useMemo(() => {
    const logs: any[] = [];
    adminBookings.forEach((b) => {
      logs.push({
        id: `audit-${b.id}`,
        action: 'BOOKING_CREATED',
        entity: 'Reservation',
        user: b.guest?.fullName || 'Guest',
        timestamp: b.createdAt,
        details: `Booking created for Room ${b.room?.roomNum} (${b.room?.resort?.name})`,
        ip: '192.168.1.104'
      });
      if (b.status === 'CONFIRMED') {
        logs.push({
          id: `audit-conf-${b.id}`,
          action: 'PAYMENT_CONFIRMED',
          entity: 'Payment',
          user: b.guest?.fullName || 'Guest',
          timestamp: b.updatedAt || b.createdAt,
          details: `Payment confirmed for total $${Number(b.totalAmount).toFixed(0)}`,
          ip: '10.0.0.12'
        });
      }
    });
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [adminBookings]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const q = auditSearchQuery.toLowerCase();
      const matchesSearch = !q || l.user?.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q);
      const matchesAction = auditActionFilter === 'ALL' || l.action === auditActionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, auditSearchQuery, auditActionFilter]);

  const totalAuditPages = Math.ceil(filteredAuditLogs.length / auditPageSize) || 1;
  const paginatedAuditLogs = useMemo(() => {
    return filteredAuditLogs.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize);
  }, [filteredAuditLogs, auditPage, auditPageSize]);

  // Services: Filtered & Paginated
  const filteredServices = useMemo(() => {
    return servicesList.filter((s) => {
      const q = serviceSearchQuery.toLowerCase();
      return !q || s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q) || s.staffName?.toLowerCase().includes(q);
    });
  }, [servicesList, serviceSearchQuery]);

  const totalServicePages = Math.ceil(filteredServices.length / servicePageSize) || 1;
  const paginatedServices = useMemo(() => {
    return filteredServices.slice((servicePage - 1) * servicePageSize, servicePage * servicePageSize);
  }, [filteredServices, servicePage, servicePageSize]);

  // Resorts: Filtered & Paginated
  const filteredResorts = useMemo(() => {
    return resortsList.filter((resort) => {
      const q = resortSearchQuery.toLowerCase();
      const matchesSearch = !q || resort.name?.toLowerCase().includes(q) || resort.location?.toLowerCase().includes(q);
      const matchesRating = resortRatingFilter === 0 || resort.rating >= resortRatingFilter;
      return matchesSearch && matchesRating;
    });
  }, [resortsList, resortSearchQuery, resortRatingFilter]);

  const totalResortPages = Math.ceil(filteredResorts.length / resortPageSize) || 1;
  const paginatedResorts = useMemo(() => {
    return filteredResorts.slice((resortPage - 1) * resortPageSize, resortPage * resortPageSize);
  }, [filteredResorts, resortPage, resortPageSize]);

  // ─── INITIAL LOADING FALLBACK ──────────────────────────────────────────────
  if (status === 'loading' || loading) {
    return (
      <div className="w-full h-screen bg-[#0C0A09] flex flex-col p-6 space-y-6">
        <KPIGridSkeleton count={5} />
        <DashboardTableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  const rawRole = (session?.user as any)?.role;
  const rawType = (session?.user as any)?.type;
  const userRole = rawRole ? String(rawRole).toUpperCase() : (rawType === 'staff' ? 'STAFF' : 'GUEST');
  const isAdmin = userRole === 'ADMIN';
  const isStaff = userRole === 'STAFF';
  const isGuest = !isAdmin && !isStaff;

  return (
    <div className="w-full h-screen bg-[#0C0A09] text-[#E5E5E5] flex overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in ${
          toastType === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toastType === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Glow Backdrops */}
      <div className="absolute top-[10%] left-[-15%] w-[400px] h-[400px] bg-brand-accent/3 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* MOBILE OVERLAY DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden flex" onClick={() => setIsMobileOpen(false)}>
          <aside className="w-72 bg-[#141414] border-r border-white/10 p-6 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="font-heading text-lg font-bold text-white">BOOKME<span className="text-brand-accent">.COM</span></span>
                <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-lg text-[#8a8a8a] hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <SidebarNav activeTab={activeTab} setActiveTab={(t) => { handleTabChange(t); setIsMobileOpen(false); }} guestTab={guestTab} setGuestTab={(t) => { handleGuestTabChange(t); setIsMobileOpen(false); }} userRole={userRole} collapsed={false} />
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase font-bold text-red-400 hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Sign Out</button>
          </aside>
        </div>
      )}

      {/* COLLAPSIBLE SIDEBAR (DESKTOP) */}
      <aside className={`hidden md:flex border-r border-white/5 bg-[#141414] flex-col justify-between transition-all duration-300 relative select-none shrink-0 h-full ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-8 z-40 bg-[#1A1A1A] border border-white/10 text-[#A0A0A0] hover:text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className="p-5 space-y-6">
          {/* Logo Header */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="h-10 w-10 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center shrink-0">
              <Compass className="h-5 w-5 text-brand-accent" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-heading text-base font-bold tracking-wider text-white truncate">
                BOOKME<span className="text-brand-accent">.COM</span>
              </span>
            )}
          </div>

          {/* Active Operator Pill */}
          {!isSidebarCollapsed ? (
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="block text-[#8a8a8a] text-[9px] uppercase font-bold tracking-wider">Active operator</span>
              <span className="block text-white text-xs font-bold truncate mt-0.5">{session?.user?.name}</span>
              <span className="block text-brand-accent text-[9px] uppercase font-bold tracking-widest mt-1">{userRole}</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-accent font-bold text-xs" title={session?.user?.name || ''}>
                {session?.user?.name?.[0] || 'U'}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <SidebarNav activeTab={activeTab} setActiveTab={handleTabChange} guestTab={guestTab} setGuestTab={handleGuestTabChange} userRole={userRole} collapsed={isSidebarCollapsed} />
        </div>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={`flex items-center gap-3 w-full p-3 rounded-xl text-xs uppercase font-bold text-red-400 hover:text-white hover:bg-red-500/10 transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden relative select-text">
        {/* PINNED TOP HEADER */}
        <header className="h-16 shrink-0 border-b border-white/5 bg-[#141414]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-2 rounded-xl bg-white/5 text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-accent flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
              {isAdmin ? `${activeTab.toUpperCase()} CONTROLS` : isStaff ? 'STAFF TASK QUEUE' : `${guestTab.toUpperCase()} PORTAL`}
            </h2>
          </div>
          <div className="text-[10px] text-[#A0A0A0] font-semibold flex items-center gap-3">
            <button
              onClick={refreshActiveTab}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              title="Re-sync data from database"
            >
              <RefreshCw className="h-3 w-3 text-brand-accent" /> Refresh Data
            </button>
            <span className="hidden sm:inline">Shift: <strong className="text-white">Day Shift</strong></span>
            <span className="text-green-400 font-bold bg-green-500/10 border border-green-500/25 px-3 py-1 rounded-full uppercase tracking-wider text-[8px] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span> Live Sync
            </span>
          </div>
        </header>

        {/* INNER SCROLL CONTENT CONTAINER */}
        <div className="flex-1 flex flex-col min-h-0 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-hidden">
          
          {/* GUEST PORTAL VIEW (For ALL non-admin, non-staff users) */}
          {isGuest && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-6">
              {/* Guest Tab 1: Reservations */}
              {guestTab === 'reservations' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">My Reservations</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Manage your stay bookings and luxury resort experiences</p>
                    </div>
                    <button onClick={() => router.push('/resorts')} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer transition-all">
                      <Plus className="h-4 w-4" /> Book New Stay
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto min-h-0 py-6 pr-1 space-y-4">
                    {(!guestData?.reservations || guestData.reservations.length === 0) ? (
                      <div className="text-center py-16 space-y-4">
                        <Calendar className="h-12 w-12 text-[#8a8a8a] mx-auto opacity-40" />
                        <p className="text-[#8a8a8a] text-sm">You have no active or past room reservations yet.</p>
                        <button onClick={() => router.push('/resorts')} className="bg-brand-accent text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-lg hover:bg-brand-accent-hover transition-all">
                          Explore Luxury Resorts
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {guestData.reservations.map((res: any) => (
                          <div key={res.id} className="p-6 rounded-2xl bg-[#141414] border border-white/5 shadow-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-white/10 transition-all">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-white text-base">Room {res.room?.roomNum}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                  res.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  res.status === 'PENDING' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                                  'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {res.status}
                                </span>
                              </div>
                              <span className="block text-xs text-[#8a8a8a] font-medium">{res.room?.roomType?.name} &bull; Check In: <strong className="text-white">{new Date(res.checkIn).toLocaleDateString()}</strong> &bull; Check Out: <strong className="text-white">{new Date(res.checkOut).toLocaleDateString()}</strong></span>
                              <span className="block text-[11px] text-brand-accent font-bold">Total Stay Amount: ${Number(res.totalAmount).toFixed(2)}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              {res.status !== 'CANCELED' && (
                                <button
                                  disabled={actionLoadingId === res.id}
                                  onClick={() => { setConfirmCancelBooking(res); setCancelAgreed(false); }}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                                >
                                  {actionLoadingId === res.id ? 'Canceling...' : 'Cancel Booking'}
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

              {/* Guest Tab 2: Favorites */}
              {guestTab === 'favorites' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="shrink-0 pb-6 border-b border-white/5">
                    <h2 className="font-heading text-xl font-normal text-white">Saved Favorites</h2>
                    <p className="text-xs text-[#8a8a8a] mt-0.5">Your shortlisted luxury resorts and dream destinations</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto min-h-0 py-6 pr-1">
                    {(!guestData?.favorites || guestData.favorites.length === 0) ? (
                      <div className="text-center py-16 space-y-4">
                        <Sparkles className="h-12 w-12 text-[#8a8a8a] mx-auto opacity-40" />
                        <p className="text-[#8a8a8a] text-sm">You haven't saved any resorts to your favorites list yet.</p>
                        <button onClick={() => router.push('/resorts')} className="bg-brand-accent text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer hover:bg-brand-accent-hover transition-all">
                          Browse Destinations
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {guestData.favorites.map((fav: any) => (
                          <div key={fav.id} className="rounded-2xl border border-white/5 bg-[#141414] overflow-hidden p-5 space-y-4 flex flex-col justify-between hover:border-white/10 transition-all">
                            <div className="space-y-3">
                              {fav.resort?.images?.[0] && (
                                <img src={fav.resort.images[0]} alt={fav.resort.name} className="h-40 w-full object-cover rounded-xl" />
                              )}
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-white text-base">{fav.resort?.name}</h3>
                                <span className="text-xs font-bold text-yellow-400">★ {fav.resort?.rating}</span>
                              </div>
                              <p className="text-xs text-[#8a8a8a] line-clamp-2">{fav.resort?.description}</p>
                              <span className="text-[10px] text-brand-accent font-bold uppercase tracking-wider block">📍 {fav.resort?.location}</span>
                            </div>
                            <button
                              onClick={() => router.push(`/resorts/${fav.resort?.id}`)}
                              className="w-full bg-brand-accent/10 hover:bg-brand-accent text-brand-accent hover:text-white border border-brand-accent/30 font-bold uppercase text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              View & Book Resort
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Guest Tab 3: Profile */}
              {guestTab === 'profile' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="shrink-0 pb-6 border-b border-white/5">
                    <h2 className="font-heading text-xl font-normal text-white">Guest Account Profile</h2>
                    <p className="text-xs text-[#8a8a8a] mt-0.5">Your registered guest account details and stay privileges</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto min-h-0 py-6 pr-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent font-bold text-2xl">
                          {session?.user?.name?.[0] || 'G'}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{session?.user?.name}</h3>
                          <span className="text-xs text-[#8a8a8a] block">{session?.user?.email}</span>
                          <span className="inline-block mt-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[9px] uppercase rounded-full">
                            Verified Guest Account
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-wider">Total Bookings</span>
                        <span className="text-3xl font-bold text-brand-accent mt-2">{guestData?.reservations?.length || 0} Stay Bookings</span>
                        <p className="text-[11px] text-[#8a8a8a] mt-4">Active and past resort reservations with bookme.com</p>
                      </div>

                      <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-wider">Saved Favorites</span>
                        <span className="text-3xl font-bold text-yellow-400 mt-2">{guestData?.favorites?.length || 0} Saved Resorts</span>
                        <p className="text-[11px] text-[#8a8a8a] mt-4">Shortlisted luxury resort properties</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAFF OPERATOR VIEW */}
          {isStaff && (
            <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="shrink-0 pb-4 border-b border-white/5">
                <h2 className="font-heading text-xl font-semibold text-white">Assigned Tasks Queue</h2>
                <p className="text-xs text-[#8a8a8a] mt-1">Operational tasks allocated to your shift queue</p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 py-6 pr-1 space-y-4">
                {staffData?.length === 0 ? (
                  <div className="text-center py-16 text-[#8a8a8a] text-sm">No pending tasks assigned to your queue.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {staffData?.map((a: any) => (
                      <div key={a.id} className={`p-6 rounded-2xl border ${a.status === 'COMPLETED' ? 'bg-[#141414]/40 border-white/5 opacity-60' : 'bg-[#1A1A1A] border-white/10 shadow-2xl'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-white text-base">Room {a.room?.roomNum}</h3>
                            <span className="text-xs text-[#8a8a8a]">{a.room?.roomType?.name} (Floor {a.room?.floor})</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold border ${a.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'}`}>
                            {a.status}
                          </span>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                          <div>
                            <span className="block text-[9px] text-[#8a8a8a] uppercase font-bold">Task</span>
                            <span className="text-white font-semibold">{a.taskType}</span>
                          </div>
                          {a.status !== 'COMPLETED' && (
                            <button
                              disabled={actionLoadingId === a.id}
                              onClick={() => handleCompleteTask(a.id)}
                              className="rounded-xl bg-brand-accent px-4 py-2 font-bold uppercase text-[10px] text-white hover:bg-brand-accent-hover transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
                            >
                              {actionLoadingId === a.id ? 'Completing...' : 'Mark Done'}
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

          {/* ADMIN OPERATOR TAB VIEWS (STRICTLY FOR ADMIN ROLE) */}
          {isAdmin && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-6">
                  {/* KPI STATS CARDS */}
                  <div className="shrink-0 grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-[#1A1A1A]/90 p-4 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider">Available</span>
                      <span className="text-2xl font-bold text-green-400 mt-1">{adminData?.stats?.availableRooms} Rooms</span>
                    </div>
                    <div className="bg-[#1A1A1A]/90 p-4 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider">Occupied</span>
                      <span className="text-2xl font-bold text-brand-accent mt-1">{adminData?.stats?.occupiedRooms} Rooms</span>
                    </div>
                    <div className="bg-[#1A1A1A]/90 p-4 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider">Dirty</span>
                      <span className="text-2xl font-bold text-red-400 mt-1">{adminData?.stats?.dirtyRooms} Rooms</span>
                    </div>
                    <div className="bg-[#1A1A1A]/90 p-4 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider">Maintenance</span>
                      <span className="text-2xl font-bold text-blue-400 mt-1">{adminData?.stats?.maintenanceRooms} Rooms</span>
                    </div>
                    <div className="bg-[#1A1A1A]/90 p-4 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between col-span-2 lg:col-span-1">
                      <span className="text-[#8a8a8a] text-[10px] uppercase font-bold tracking-wider">Total Revenue</span>
                      <span className="text-2xl font-bold text-white mt-1">${adminData?.stats?.totalRevenue?.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* ROOM BOARD CONTAINER */}
                  <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Pinned Filter Toolbar */}
                    <div className="shrink-0 pb-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-white">Interactive Rooms Board</h3>
                        <p className="text-xs text-[#8a8a8a]">Live visual status of resort rooms</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8a8a8a]" />
                          <input
                            type="text"
                            placeholder="Filter Room..."
                            value={overviewRoomSearch}
                            onChange={(e) => { setOverviewRoomSearch(e.target.value); setOverviewRoomPage(1); }}
                            className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-brand-accent w-40"
                          />
                        </div>
                        <select
                          value={overviewRoomFilter}
                          onChange={(e: any) => { setOverviewRoomFilter(e.target.value); setOverviewRoomPage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand-accent cursor-pointer"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="AVAILABLE">Available</option>
                          <option value="OCCUPIED">Occupied</option>
                          <option value="DIRTY">Dirty</option>
                          <option value="MAINTENANCE">Maintenance</option>
                        </select>
                      </div>
                    </div>

                    {/* Scrollable Room Grid */}
                    <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                      {paginatedOverviewRooms.length === 0 ? (
                        <div className="text-center py-12 text-[#8a8a8a] text-sm">No rooms match filter settings.</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                          {paginatedOverviewRooms.map((r: any) => {
                            const statusColor = r.status === 'AVAILABLE' ? 'border-green-500/50 bg-green-500/5 text-green-400' :
                                                r.status === 'OCCUPIED' ? 'border-brand-accent/50 bg-brand-accent/5 text-brand-accent' :
                                                r.status === 'DIRTY' ? 'border-red-500/50 bg-red-500/5 text-red-400' :
                                                'border-blue-500/50 bg-blue-500/5 text-blue-400';
                            return (
                              <div key={r.id} className={`p-4 rounded-xl border text-center font-bold space-y-1 transition-all hover:scale-105 select-none ${statusColor}`}>
                                <span className="block text-[9px] uppercase text-[#8a8a8a]">Room</span>
                                <span className="text-base text-white block">{r.roomNum}</span>
                                <span className="text-[8px] uppercase block tracking-widest truncate text-white/50">{r.roomType?.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Pinned Pagination Controls */}
                    <PaginationFooter currentPage={overviewRoomPage} totalPages={totalOverviewRoomPages} onPageChange={setOverviewRoomPage} totalItems={filteredOverviewRooms.length} />
                  </div>
                </div>
              )}

              {/* TAB 2: BOOKINGS DESK */}
              {activeTab === 'bookings' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Pinned Filter Toolbar */}
                  <div className="shrink-0 pb-6 border-b border-white/5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="font-heading text-xl font-normal text-white">Bookings Desk</h2>
                        <p className="text-xs text-[#8a8a8a] mt-0.5">Manage guest stay status and check-in procedures</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={exportBookingsCSV}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Export bookings as CSV report"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-green-400" /> Export CSV
                        </button>
                        <select
                          value={bookingPageSize}
                          onChange={(e) => { setBookingPageSize(Number(e.target.value)); setBookingPage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value={8}>8 / page</option>
                          <option value={15}>15 / page</option>
                          <option value={25}>25 / page</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#8a8a8a]" />
                        <input
                          type="text"
                          placeholder="Search guest name, email, or code..."
                          value={bookingSearchQuery}
                          onChange={(e) => { setBookingSearchQuery(e.target.value); setBookingPage(1); }}
                          className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-accent"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                        {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELED', 'ACTIVE_STAYS'] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => { setBookingFilterStatus(filter); setBookingPage(1); }}
                            className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                              bookingFilterStatus === filter 
                                ? 'bg-brand-accent text-white border-brand-accent shadow-md shadow-brand-accent/20'
                                : 'bg-white/5 text-[#8a8a8a] border-white/5 hover:text-white'
                            }`}
                          >
                            {filter.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Table Content */}
                  <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                    {tabLoading ? (
                      <DashboardTableSkeleton rows={bookingPageSize} cols={6} />
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black sticky top-0 bg-[#1A1A1A] z-10 py-2">
                            <th className="pb-3">Guest Profile</th>
                            <th className="pb-3 px-3">Room / Resort</th>
                            <th className="pb-3 px-3">Timeline</th>
                            <th className="pb-3 px-3">Cost</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 text-right">Action Desk</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                          {paginatedBookings.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-[#8a8a8a]">No bookings match filter.</td></tr>
                          ) : (
                            paginatedBookings.map((r) => {
                              const isActiveStay = r.status === 'CONFIRMED' && r.room?.status === 'OCCUPIED';
                              const isPendingCheckIn = (r.status === 'PENDING' || r.status === 'CONFIRMED') && r.room?.status !== 'OCCUPIED' && r.room?.status !== 'DIRTY' && r.status !== 'CANCELED';
                              return (
                                <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="py-4">
                                    <span className="font-bold text-white block">{r.guest?.fullName}</span>
                                    <span className="text-[10px] text-[#8a8a8a] block">{r.guest?.email}</span>
                                  </td>
                                  <td className="py-4 px-3">
                                    <span className="font-semibold text-white block">Room {r.room?.roomNum}</span>
                                    <span className="text-[10px] text-[#8a8a8a] block truncate max-w-[150px]">{r.room?.resort?.name}</span>
                                  </td>
                                  <td className="py-4 px-3 font-semibold">
                                    <span className="block text-white">{new Date(r.checkIn).toLocaleDateString()} - {new Date(r.checkOut).toLocaleDateString()}</span>
                                  </td>
                                  <td className="py-4 px-3 font-bold text-white">${Number(r.totalAmount).toFixed(0)}</td>
                                  <td className="py-4 px-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                      r.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                      r.status === 'PENDING' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                                      'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="py-4 text-right space-y-1">
                                    <div className="flex justify-end gap-2">
                                      {isPendingCheckIn && (
                                        <button disabled={actionLoadingId !== null} onClick={() => handleAdminCheckIn(r.id)} className="bg-green-500/10 text-green-400 px-2.5 py-1 rounded-lg text-[9px] uppercase font-bold hover:bg-green-500/20">Check In</button>
                                      )}
                                      {isActiveStay && (
                                        <button disabled={actionLoadingId !== null} onClick={() => handleAdminCheckOut(r.id)} className="bg-brand-accent/10 text-brand-accent px-2.5 py-1 rounded-lg text-[9px] uppercase font-bold hover:bg-brand-accent/20">Check Out</button>
                                      )}
                                      {r.status !== 'CANCELED' && (
                                        <button disabled={actionLoadingId !== null} onClick={() => handleCancelBooking(r.id)} className="bg-red-500/10 text-red-400 px-2 py-1 rounded-lg text-[9px] uppercase font-bold hover:bg-red-500/20">Cancel</button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pinned Pagination */}
                  <PaginationFooter currentPage={bookingPage} totalPages={totalBookingPages} onPageChange={setBookingPage} totalItems={filteredBookings.length} />
                </div>
              )}

              {/* TAB 3: HOUSEKEEPING */}
              {activeTab === 'rooms' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Pinned Toolbar */}
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">Housekeeping & Operations</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Assign turnover cleaning and maintenance tasks</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8a8a8a]" />
                        <input
                          type="text"
                          placeholder="Search room..."
                          value={hkSearchQuery}
                          onChange={(e) => { setHkSearchQuery(e.target.value); setHkPage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none w-36"
                        />
                      </div>
                      <select
                        value={hkRoomFilter}
                        onChange={(e: any) => { setHkRoomFilter(e.target.value); setHkPage(1); }}
                        className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="OCCUPIED">Occupied</option>
                        <option value="DIRTY">Dirty</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                      <button onClick={() => setAssignModalOpen(true)} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-1.5 rounded-xl text-xs uppercase font-bold flex items-center gap-1.5 shadow-lg cursor-pointer">
                        <Plus className="h-4 w-4" /> Assign Task
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Room Task Cards Grid */}
                  <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                    {tabLoading ? (
                      <RoomsBoardSkeleton />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {paginatedHkRooms.map((r: any) => (
                          <div key={r.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white text-sm">Room {r.roomNum}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                r.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                r.status === 'DIRTY' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                r.status === 'OCCUPIED' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>{r.status}</span>
                            </div>
                            <span className="block text-[10px] text-[#8a8a8a]">{r.roomType?.name} (Floor {r.floor})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pinned Pagination */}
                  <PaginationFooter currentPage={hkPage} totalPages={totalHkPages} onPageChange={setHkPage} totalItems={filteredHkRooms.length} />
                </div>
              )}

              {/* TAB 4: STAFFING */}
              {activeTab === 'staff' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Pinned Toolbar */}
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">Staff Management</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Directory of registered personnel and operators</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8a8a8a]" />
                        <input
                          type="text"
                          placeholder="Search staff..."
                          value={staffSearchQuery}
                          onChange={(e) => { setStaffSearchQuery(e.target.value); setStaffPage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none w-40"
                        />
                      </div>
                      <select value={staffRoleFilter} onChange={(e) => { setStaffRoleFilter(e.target.value); setStaffPage(1); }} className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer">
                        <option value="ALL">All Roles</option>
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button onClick={() => setStaffModalOpen(true)} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-1.5 rounded-xl text-xs uppercase font-bold flex items-center gap-1.5 shadow-lg cursor-pointer">
                        <Plus className="h-4 w-4" /> Add Staff
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Table */}
                  <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                    {tabLoading ? (
                      <DashboardTableSkeleton rows={staffPageSize} cols={5} />
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black sticky top-0 bg-[#1A1A1A]">
                            <th className="pb-3">Name / Email</th>
                            <th className="pb-3 px-3">Role</th>
                            <th className="pb-3 px-3">Shift</th>
                            <th className="pb-3 px-3">Department</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                          {paginatedStaff.map((s) => (
                            <tr key={s.id} className="hover:bg-white/[0.01]">
                              <td className="py-3.5"><span className="font-bold text-white block">{s.name}</span><span className="text-[10px] text-[#8a8a8a]">{s.email}</span></td>
                              <td className="py-3.5 px-3"><span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase bg-white/5 text-white border-white/10">{s.role}</span></td>
                              <td className="py-3.5 px-3 font-semibold text-white">{s.shift || 'Day'}</td>
                              <td className="py-3.5 px-3 text-[#8a8a8a]">{s.department?.name || 'General'}</td>
                              <td className="py-3.5 text-right">
                                {deletingStaffId === s.id ? (
                                  <div className="flex justify-end gap-1">
                                    <button disabled={actionLoadingId === s.id} onClick={() => executeDeleteStaff(s.id)} className="bg-red-500 text-white text-[8px] font-bold py-1 px-2 rounded">Yes</button>
                                    <button onClick={() => setDeletingStaffId(null)} className="bg-white/10 text-white text-[8px] font-bold py-1 px-2 rounded">No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeletingStaffId(s.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pinned Pagination */}
                  <PaginationFooter currentPage={staffPage} totalPages={totalStaffPages} onPageChange={setStaffPage} totalItems={filteredStaff.length} />
                </div>
              )}

              {/* TAB: ROLES & ACCESS CONTROL */}
              {activeTab === 'roles' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">Dynamic Roles & Access Control</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Create custom staff roles and define permission privileges</p>
                    </div>
                    <button 
                      onClick={() => setRoleModalOpen(true)}
                      className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                    >
                      <Plus className="h-4 w-4" /> Create Custom Role
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0 py-6 pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rolesList.map((r) => (
                      <div key={r.id} className="bg-[#141414]/90 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-xl">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs rounded-lg uppercase tracking-wider">
                              {r.name}
                            </span>
                            <span className="text-[10px] text-stone-400 font-bold bg-white/5 px-2.5 py-1 rounded-full">
                              {r.staffCount || 0} Staff Assigned
                            </span>
                          </div>
                          <p className="text-stone-300 text-xs font-light leading-relaxed mb-4">{r.description}</p>
                          
                          <div className="space-y-1.5 mb-4">
                            <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Granted Permissions:</span>
                            <div className="flex flex-wrap gap-1">
                              {r.permissions?.map((p: string) => (
                                <span key={p} className="bg-white/5 border border-white/5 text-stone-300 text-[9px] font-mono px-2 py-0.5 rounded">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-end">
                          {r.name !== 'ADMIN' && r.name !== 'STAFF' && (
                            <button
                              onClick={() => handleDeleteRole(r.id)}
                              className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase flex items-center gap-1 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Role
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: DEPARTMENTS */}
              {activeTab === 'depts' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Pinned Toolbar */}
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">Department Architecture</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Organize organizational branches and team heads</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8a8a8a]" />
                        <input
                          type="text"
                          placeholder="Search dept..."
                          value={deptSearchQuery}
                          onChange={(e) => { setDeptSearchQuery(e.target.value); setDeptPage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none w-40"
                        />
                      </div>
                      <button onClick={() => setDeptModalOpen(true)} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-1.5 rounded-xl text-xs uppercase font-bold flex items-center gap-1.5 shadow-lg cursor-pointer">
                        <Plus className="h-4 w-4" /> Add Department
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Table */}
                  <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                    {tabLoading ? (
                      <DashboardTableSkeleton rows={deptPageSize} cols={4} />
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black sticky top-0 bg-[#1A1A1A]">
                            <th className="pb-3">Department Name</th>
                            <th className="pb-3 px-3">Manager / Head</th>
                            <th className="pb-3 px-3">Active Staff</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                          {paginatedDepts.map((d) => (
                            <tr key={d.id} className="hover:bg-white/[0.01]">
                              <td className="py-3.5 font-bold text-white">{d.name}</td>
                              <td className="py-3.5 px-3 font-semibold text-white">{d.managerName || 'Unassigned'}</td>
                              <td className="py-3.5 px-3 font-bold text-brand-accent">{d._count?.staff || 0} Members</td>
                              <td className="py-3.5 text-right">
                                {deletingDeptId === d.id ? (
                                  <div className="flex justify-end gap-1">
                                    <button disabled={actionLoadingId === d.id} onClick={() => executeDeleteDept(d.id)} className="bg-red-500 text-white text-[8px] font-bold py-1 px-2 rounded">Yes</button>
                                    <button onClick={() => setDeletingDeptId(null)} className="bg-white/10 text-white text-[8px] font-bold py-1 px-2 rounded">No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeletingDeptId(d.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pinned Pagination */}
                  <PaginationFooter currentPage={deptPage} totalPages={totalDeptPages} onPageChange={setDeptPage} totalItems={filteredDepts.length} />
                </div>
              )}

              {/* TAB: SERVICES CATALOG */}
              {activeTab === 'services' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Pinned Toolbar */}
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">Services & Amenities Catalog</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Manage luxury resort experiences, spa packages, and guest add-ons</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8a8a8a]" />
                        <input
                          type="text"
                          placeholder="Search service..."
                          value={serviceSearchQuery}
                          onChange={(e) => { setServiceSearchQuery(e.target.value); setServicePage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none w-40"
                        />
                      </div>
                      <button onClick={() => setServiceModalOpen(true)} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-1.5 rounded-xl text-xs uppercase font-bold flex items-center gap-1.5 shadow-lg cursor-pointer">
                        <Plus className="h-4 w-4" /> Add Service
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Table */}
                  <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                    {tabLoading ? (
                      <DashboardTableSkeleton rows={servicePageSize} cols={5} />
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black sticky top-0 bg-[#1A1A1A]">
                            <th className="pb-3">Service Name</th>
                            <th className="pb-3 px-3">Category</th>
                            <th className="pb-3 px-3">Price</th>
                            <th className="pb-3 px-3">Assigned Staff</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                          {paginatedServices.map((s) => (
                            <tr key={s.id} className="hover:bg-white/[0.01]">
                              <td className="py-3.5 font-bold text-white">{s.name}</td>
                              <td className="py-3.5 px-3">
                                <span className="bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">{s.category}</span>
                              </td>
                              <td className="py-3.5 px-3 font-bold text-green-400">${Number(s.price).toFixed(2)}</td>
                              <td className="py-3.5 px-3 font-semibold text-white">{s.staffName || 'Unassigned'}</td>
                              <td className="py-3.5 text-right">
                                {deletingServiceId === s.id ? (
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => { handleDeleteService(s.id); setDeletingServiceId(null); }} className="bg-red-500 text-white text-[8px] font-bold py-1 px-2 rounded cursor-pointer">Yes</button>
                                    <button onClick={() => setDeletingServiceId(null)} className="bg-white/10 text-white text-[8px] font-bold py-1 px-2 rounded cursor-pointer">No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeletingServiceId(s.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pinned Pagination */}
                  <PaginationFooter currentPage={servicePage} totalPages={totalServicePages} onPageChange={setServicePage} totalItems={filteredServices.length} />
                </div>
              )}

              {/* TAB 6: LEDGERS */}
              {activeTab === 'finance' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Pinned Toolbar */}
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">Financial Transactions Ledger</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Real-time payment logs and revenue tracking</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={exportFinanceCSV}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Export payments ledger as CSV"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-400" /> Export CSV
                      </button>
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8a8a8a]" />
                        <input
                          type="text"
                          placeholder="Search transaction..."
                          value={financeSearchQuery}
                          onChange={(e) => { setFinanceSearchQuery(e.target.value); setFinancePage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none w-44"
                        />
                      </div>
                      <select value={financeStatusFilter} onChange={(e) => { setFinanceStatusFilter(e.target.value); setFinancePage(1); }} className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer">
                        <option value="ALL">All Statuses</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    </div>
                  </div>

                  {/* Scrollable Table */}
                  <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                    {tabLoading ? (
                      <DashboardTableSkeleton rows={financePageSize} cols={5} />
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black sticky top-0 bg-[#1A1A1A]">
                            <th className="pb-3">Transaction ID</th>
                            <th className="pb-3 px-3">Guest</th>
                            <th className="pb-3 px-3">Amount</th>
                            <th className="pb-3 px-3">Paid Date</th>
                            <th className="pb-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                          {paginatedPayments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-white/[0.01]">
                              <td className="py-3.5 font-bold text-white font-mono text-[10px]">{p.stripeId || p.id}</td>
                              <td className="py-3.5 px-3 font-semibold text-white">{p.booking?.guest?.fullName}</td>
                              <td className="py-3.5 px-3 font-bold text-green-400">${Number(p.amount).toFixed(2)}</td>
                              <td className="py-3.5 px-3 text-[#8a8a8a]">{new Date(p.paidAt).toLocaleDateString()}</td>
                              <td className="py-3.5 text-right">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                                  p.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
                                }`}>{p.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pinned Pagination */}
                  <PaginationFooter currentPage={financePage} totalPages={totalFinancePages} onPageChange={setFinancePage} totalItems={filteredPayments.length} />
                </div>
              )}

              {/* TAB 7: AUDITS */}
              {activeTab === 'audits' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Pinned Toolbar */}
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">System Security Audits</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Audit trail of operational events and admin triggers</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8a8a8a]" />
                        <input
                          type="text"
                          placeholder="Search audit trail..."
                          value={auditSearchQuery}
                          onChange={(e) => { setAuditSearchQuery(e.target.value); setAuditPage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none w-44"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Table */}
                  <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                    {tabLoading ? (
                      <AuditLogsSkeleton rows={auditPageSize} />
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#8a8a8a] uppercase tracking-widest font-black sticky top-0 bg-[#1A1A1A]">
                            <th className="pb-3">Event / Action</th>
                            <th className="pb-3 px-3">Operator</th>
                            <th className="pb-3 px-3">Details</th>
                            <th className="pb-3 px-3">Timestamp</th>
                            <th className="pb-3 text-right">IP Address</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#A0A0A0] divide-y divide-white/5">
                          {paginatedAuditLogs.map((l: any) => (
                            <tr key={l.id} className="hover:bg-white/[0.01]">
                              <td className="py-3.5 font-bold text-white">{l.action}</td>
                              <td className="py-3.5 px-3 text-white font-semibold">{l.user}</td>
                              <td className="py-3.5 px-3 text-[#8a8a8a]">{l.details}</td>
                              <td className="py-3.5 px-3 text-[#8a8a8a]">{new Date(l.timestamp).toLocaleString()}</td>
                              <td className="py-3.5 text-right font-mono text-[10px] text-brand-accent">{l.ip}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pinned Pagination */}
                  <PaginationFooter currentPage={auditPage} totalPages={totalAuditPages} onPageChange={setAuditPage} totalItems={filteredAuditLogs.length} />
                </div>
              )}

              {/* TAB 8: PROPERTIES / RESORTS */}
              {activeTab === 'resorts' && (
                <div className="bg-[#1A1A1A]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Pinned Toolbar */}
                  <div className="shrink-0 pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-normal text-white">Resort Properties</h2>
                      <p className="text-xs text-[#8a8a8a] mt-0.5">Manage luxury resort destinations and portfolio listings</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8a8a8a]" />
                        <input
                          type="text"
                          placeholder="Search resort..."
                          value={resortSearchQuery}
                          onChange={(e) => { setResortSearchQuery(e.target.value); setResortPage(1); }}
                          className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none w-40"
                        />
                      </div>
                      {/* Navigates to dedicated Add Resort page */}
                      <button
                        onClick={() => router.push('/dashboard/resorts/new')}
                        className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-1.5 rounded-xl text-xs uppercase font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Add Resort
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Cards Grid */}
                  <div className="flex-1 overflow-y-auto min-h-0 py-4 pr-1">
                    {tabLoading ? (
                      <ResortGridSkeleton count={resortPageSize} />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedResorts.map((r: any) => (
                          <div key={r.id} className="rounded-2xl border border-white/5 bg-[#141414] overflow-hidden p-5 space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                              {r.images?.[0] && (
                                <img src={r.images[0]} alt={r.name} className="h-40 w-full object-cover rounded-xl" />
                              )}
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-white text-base">{r.name}</h3>
                                <span className="text-xs font-bold text-yellow-400">★ {r.rating}</span>
                              </div>
                              <p className="text-xs text-[#8a8a8a] line-clamp-2">{r.description}</p>
                              <span className="text-[10px] text-brand-accent font-bold uppercase tracking-wider block">📍 {r.location}</span>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                              {/* Navigates to dedicated Edit Resort page */}
                              <button
                                onClick={() => router.push(`/dashboard/resorts/${r.id}`)}
                                className="text-xs text-[#A0A0A0] hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" /> Edit
                              </button>
                              {deletingResortId === r.id ? (
                                <div className="flex gap-1">
                                  <button disabled={actionLoadingId === r.id} onClick={() => executeDeleteResort(r.id)} className="bg-red-500 text-white text-[8px] font-bold py-1 px-2 rounded">Yes</button>
                                  <button onClick={() => setDeletingResortId(null)} className="bg-white/10 text-white text-[8px] font-bold py-1 px-2 rounded">No</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeletingResortId(r.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pinned Pagination */}
                  <PaginationFooter currentPage={resortPage} totalPages={totalResortPages} onPageChange={setResortPage} totalItems={filteredResorts.length} />
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* ─── MODALS ───────────────────────────────────────────────────────── */}

      {/* Assign Task Modal */}
      {assignModalOpen && (
        <ModalWrapper title="Assign Cleaning / Repair Task" onClose={() => setAssignModalOpen(false)}>
          <form onSubmit={handleAssignTask} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#8a8a8a] mb-1">Select Room</label>
              <select value={assignRoomId} onChange={(e) => setAssignRoomId(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs">
                {hkRooms.map((r) => (
                  <option key={r.id} value={r.id}>Room {r.roomNum} ({r.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8a8a8a] mb-1">Select Operator Staff</label>
              <select value={assignStaffId} onChange={(e) => setAssignStaffId(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs">
                {hkStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8a8a8a] mb-1">Task Type</label>
              <select value={assignTaskType} onChange={(e) => setAssignTaskType(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs">
                <option value="Turnover Cleaning">Turnover Cleaning</option>
                <option value="Deep Clean">Deep Clean</option>
                <option value="Maintenance Repair">Maintenance Repair</option>
              </select>
            </div>
            <button disabled={assignLoading} type="submit" className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg cursor-pointer">
              {assignLoading ? 'Assigning...' : 'Dispatch Task'}
            </button>
          </form>
        </ModalWrapper>
      )}

      {/* Add Staff Modal */}
      {staffModalOpen && (
        <ModalWrapper title="Register New Staff Operator" onClose={() => setStaffModalOpen(false)}>
          <form onSubmit={handleRegisterStaff} className="space-y-4">
            <input type="text" placeholder="Full Name" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} required className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs" />
            <input type="email" placeholder="Email Address" value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} required className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs" />
            <input type="password" placeholder="Password" value={newStaffPassword} onChange={(e) => setNewStaffPassword(e.target.value)} required className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs" />
            <div className="grid grid-cols-2 gap-4">
              <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs">
                {rolesList.length > 0 ? (
                  rolesList.map(r => (
                    <option key={r.id} value={r.name}>{r.name.replace(/_/g, ' ')}</option>
                  ))
                ) : (
                  <>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </>
                )}
              </select>
              <select value={newStaffShift} onChange={(e) => setNewStaffShift(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs">
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
            <button disabled={staffLoading} type="submit" className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg cursor-pointer">
              {staffLoading ? 'Registering...' : 'Register Operator'}
            </button>
          </form>
        </ModalWrapper>
      )}

      {/* Add Role Modal */}
      {roleModalOpen && (
        <ModalWrapper title="Create Dynamic Staff Role" onClose={() => setRoleModalOpen(false)}>
          {roleMsg && <p className="text-rose-400 text-xs mb-3 font-semibold">{roleMsg}</p>}
          <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#8a8a8a] uppercase font-bold text-[10px] mb-1">Role Title Name</label>
              <input
                type="text"
                required
                placeholder="e.g. SPA_DIRECTOR, CONCIERGE_LEAD"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div>
              <label className="block text-[#8a8a8a] uppercase font-bold text-[10px] mb-1">Role Description</label>
              <textarea
                rows={2}
                placeholder="Describe staff duties and operational access scope..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-accent resize-none"
              />
            </div>

            <div>
              <label className="block text-[#8a8a8a] uppercase font-bold text-[10px] mb-2">Granted Permission Flags</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {[
                  'MANAGE_BOOKINGS',
                  'HOUSEKEEPING',
                  'FINANCE_ACCESS',
                  'STAFF_MANAGEMENT',
                  'DEPT_MANAGEMENT',
                  'MANAGE_SERVICES',
                  'PROPERTIES_MANAGEMENT'
                ].map((perm) => (
                  <label key={perm} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg cursor-pointer border border-white/5 hover:border-amber-500/30">
                    <input
                      type="checkbox"
                      checked={newRolePermissions.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRolePermissions(prev => [...prev, perm]);
                        } else {
                          setNewRolePermissions(prev => prev.filter(p => p !== perm));
                        }
                      }}
                      className="accent-amber-500"
                    />
                    <span className="text-[10px] font-mono font-bold text-stone-300">{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setRoleModalOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-white font-bold uppercase text-[10px]">Cancel</button>
              <button type="submit" disabled={roleLoading} className="px-5 py-2 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold uppercase text-[10px]">
                {roleLoading ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* Add Service Modal */}
      {serviceModalOpen && (
        <ModalWrapper title="Add Resort Experience Service" onClose={() => setServiceModalOpen(false)}>
          {serviceMsg && <p className="text-rose-400 text-xs mb-3 font-semibold">{serviceMsg}</p>}
          <form onSubmit={handleCreateService} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#8a8a8a] uppercase font-bold text-[10px] mb-1">Service Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Sunset Yacht Cruise, Couples Spa Treatment"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div>
              <label className="block text-[#8a8a8a] uppercase font-bold text-[10px] mb-1">Category</label>
              <select
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs"
              >
                <option value="Wellness & Spa">Wellness & Spa</option>
                <option value="Dining & Culinary">Dining & Culinary</option>
                <option value="Excursions & Water Sports">Excursions & Water Sports</option>
                <option value="VIP Logistics">VIP Logistics</option>
              </select>
            </div>

            <div>
              <label className="block text-[#8a8a8a] uppercase font-bold text-[10px] mb-1">Price ($ USD)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 150.00"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setServiceModalOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-white font-bold uppercase text-[10px]">Cancel</button>
              <button type="submit" disabled={serviceLoading} className="px-5 py-2 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold uppercase text-[10px]">
                {serviceLoading ? 'Creating...' : 'Add Service'}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* Add Dept Modal */}
      {deptModalOpen && (
        <ModalWrapper title="Create New Department" onClose={() => setDeptModalOpen(false)}>
          <form onSubmit={handleCreateDept} className="space-y-4">
            <input type="text" placeholder="Department Name" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} required className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs" />
            <input type="text" placeholder="Manager / Department Head" value={newDeptManager} onChange={(e) => setNewDeptManager(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-xs" />
            <button disabled={deptLoading} type="submit" className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white py-3 rounded-xl font-bold uppercase text-xs shadow-lg cursor-pointer">
              {deptLoading ? 'Creating...' : 'Create Department'}
            </button>
          </form>
        </ModalWrapper>
      )}

      {/* Dynamic Tiered Cancellation Confirmation Modal */}
      {confirmCancelBooking && (() => {
        const checkInTime = new Date(confirmCancelBooking.checkIn).getTime();
        const daysRemaining = Math.max(0, Math.ceil((checkInTime - Date.now()) / (1000 * 60 * 60 * 24)));
        
        let refundPct = 100;
        let badgeColor = 'bg-green-500/10 border-green-500/30 text-green-400';
        let badgeText = '100% Full Refund Eligible';

        if (confirmCancelBooking.status === 'CONFIRMED') {
          if (daysRemaining >= 7) {
            refundPct = 100;
            badgeColor = 'bg-green-500/10 border-green-500/30 text-green-400';
            badgeText = '100% Full Refund Eligible (>= 7 Days Notice)';
          } else if (daysRemaining >= 3) {
            refundPct = 95;
            badgeColor = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
            badgeText = '95% Refund (5% Processing Fee, 3-7 Days Notice)';
          } else {
            refundPct = 90;
            badgeColor = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
            badgeText = '90% Refund (10% Max Cancellation Fee, < 72h Notice)';
          }
        }

        const totalPaid = Number(confirmCancelBooking.totalAmount);
        const refundAmt = (totalPaid * refundPct) / 100;
        const retentionFee = totalPaid - refundAmt;

        return (
          <ModalWrapper title="Confirm Reservation Cancellation" onClose={() => setConfirmCancelBooking(null)}>
            <div className="space-y-4 text-xs select-none">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="block font-bold text-white text-sm">Room {confirmCancelBooking.room?.roomNum} &bull; {confirmCancelBooking.room?.roomType?.name}</span>
                <span className="block text-[#8a8a8a]">Stay: {new Date(confirmCancelBooking.checkIn).toLocaleDateString()} - {new Date(confirmCancelBooking.checkOut).toLocaleDateString()}</span>
                <span className="block text-[10px] text-brand-accent font-bold mt-1">⏳ {daysRemaining} days remaining until check-in</span>
              </div>

              {/* Policy Tier Badge */}
              <div className={`p-3 rounded-xl border text-center font-bold uppercase tracking-wider text-[10px] ${badgeColor}`}>
                {badgeText}
              </div>

              {/* Refund Breakdown Card */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex justify-between text-[#8a8a8a]">
                  <span>Total Paid Amount:</span>
                  <span className="font-bold text-white">${totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Retention Fee ({100 - refundPct}%):</span>
                  <span className="font-bold">-${retentionFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm text-green-400">
                  <span>Net Refund to Card ({refundPct}%):</span>
                  <span>${refundAmt.toFixed(2)}</span>
                </div>
              </div>

              {/* Policy Disclaimer */}
              <p className="text-[10px] text-[#8a8a8a] leading-relaxed">
                By confirming cancellation, your reservation status will be set to CANCELED. Net refund amount will be credited back to your original source card within 5-10 business days.
              </p>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelAgreed}
                  onChange={(e) => setCancelAgreed(e.target.checked)}
                  className="mt-0.5 accent-brand-accent"
                />
                <span className="text-[11px] text-white font-medium">
                  I have read and accept the cancellation fee policy terms.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmCancelBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white font-bold uppercase text-[10px] hover:bg-white/5 transition-all cursor-pointer"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={!cancelAgreed || actionLoadingId === confirmCancelBooking.id}
                  onClick={() => {
                    const targetId = confirmCancelBooking.id;
                    setConfirmCancelBooking(null);
                    handleCancelBooking(targetId);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold uppercase text-[10px] shadow-lg transition-all cursor-pointer"
                >
                  {actionLoadingId === confirmCancelBooking.id ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </ModalWrapper>
        );
      })()}

    </div>
  );
}

// ─── REUSABLE SIDEBAR NAV ──────────────────────────────────────────────────
function SidebarNav({
  activeTab,
  setActiveTab,
  guestTab,
  setGuestTab,
  userRole,
  collapsed
}: {
  activeTab: string;
  setActiveTab: (t: any) => void;
  guestTab: string;
  setGuestTab: (t: any) => void;
  userRole: string;
  collapsed: boolean;
}) {
  if (userRole === 'ADMIN') {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: Activity },
      { id: 'bookings', label: 'Bookings Desk', icon: Calendar },
      { id: 'rooms', label: 'Housekeeping', icon: Building },
      { id: 'staff', label: 'Staffing', icon: Users },
      { id: 'roles', label: 'Roles & Access', icon: ShieldCheck },
      { id: 'depts', label: 'Departments', icon: Layers },
      { id: 'services', label: 'Services Catalog', icon: Sparkles },
      { id: 'finance', label: 'Ledgers', icon: DollarSign },
      { id: 'audits', label: 'Audits', icon: FileSpreadsheet },
      { id: 'resorts', label: 'Properties', icon: Compass },
    ];

    return (
      <nav className="space-y-1 select-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-xs uppercase font-bold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                  : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? t.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t.label}</span>}
            </button>
          );
        })}
      </nav>
    );
  }

  if (userRole === 'STAFF') {
    const staffTabs = [
      { id: 'queue', label: 'Task Queue', icon: Activity },
      { id: 'profile', label: 'My Profile', icon: User },
    ];

    return (
      <nav className="space-y-1 select-none">
        {staffTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id || activeTab === 'overview';
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-xs uppercase font-bold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                  : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? t.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t.label}</span>}
            </button>
          );
        })}
      </nav>
    );
  }

  // DEFAULT FALLBACK FOR ALL GUEST USERS (MY BOOKINGS, SAVED FAVORITES, MY PROFILE)
  const guestTabs = [
    { id: 'reservations', label: 'My Bookings', icon: Calendar },
    { id: 'favorites', label: 'Saved Favorites', icon: Sparkles },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <nav className="space-y-1 select-none">
      {guestTabs.map((t) => {
        const Icon = t.icon;
        const isActive = guestTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setGuestTab(t.id)}
            className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-xs uppercase font-bold transition-all text-left cursor-pointer ${
              isActive
                ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'
            } ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? t.label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}

// ─── REUSABLE PAGINATION FOOTER ────────────────────────────────────────────
function PaginationFooter({ currentPage, totalPages, onPageChange, totalItems }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void; totalItems: number }) {
  return (
    <div className="shrink-0 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#1A1A1A] px-2 select-none">
      <span className="text-[11px] text-[#8a8a8a]">
        Showing Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({totalItems} items total)
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === pageNum ? 'bg-brand-accent text-white' : 'bg-white/5 text-[#8a8a8a] hover:text-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── REUSABLE MODAL WRAPPER ────────────────────────────────────────────────
function ModalWrapper({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-scale-in relative">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h3 className="font-heading text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[#8a8a8a] hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
