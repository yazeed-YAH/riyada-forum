'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, Shield, Settings, Crown, LogOut, ArrowRight, Trash2, Edit, Plus,
  Eye, EyeOff, Calendar, UserCheck, Handshake, Lock, Unlock, Download
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Permissions {
  events: boolean
  members: boolean
  registrations: boolean
  sponsors: boolean
  settings: boolean
  export: boolean
}

interface Admin {
  id: string
  name: string | null
  email: string
  role: string
  permissions?: string
  createdAt: string
}

interface Stats {
  totalMembers: number
  totalEvents: number
  totalSponsors: number
  totalAdmins: number
}

const PERMISSION_OPTIONS = [
  { key: 'events', label: 'إدارة اللقاءات', icon: Calendar, description: 'إنشاء وتعديل وحذف اللقاءات' },
  { key: 'members', label: 'إدارة الأعضاء', icon: Users, description: 'عرض وتعديل بيانات الأعضاء' },
  { key: 'registrations', label: 'إدارة التسجيلات', icon: UserCheck, description: 'عرض وإدارة تسجيلات الحضور' },
  { key: 'sponsors', label: 'إدارة الرعاة', icon: Handshake, description: 'عرض وإدارة طلبات الرعاية' },
  { key: 'settings', label: 'إعدادات الموقع', icon: Settings, description: 'تعديل إعدادات الموقع العامة' },
  { key: 'export', label: 'تصدير البيانات', icon: Download, description: 'تصدير بيانات الأعضاء والرعاة' },
]

const defaultPermissions: Permissions = {
  events: true,
  members: true,
  registrations: true,
  sponsors: true,
  settings: false,
  export: false
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: { ...defaultPermissions }
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check')
      const data = await response.json()
      if (data.isAdmin) {
        setCurrentAdmin(data.admin)
        fetchData()
      } else {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    }
  }

  const fetchData = async () => {
    try {
      // جلب الأدمنز
      const adminsRes = await fetch('/api/super-admin/admins')
      if (adminsRes.ok) {
        const adminsData = await adminsRes.json()
        setAdmins(adminsData.admins || [])
      }
      
      // جلب الإحصائيات
      const statsRes = await fetch('/api/super-admin/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const parsePermissions = (permissionsStr?: string): Permissions => {
    if (!permissionsStr) return { ...defaultPermissions }
    try {
      return JSON.parse(permissionsStr)
    } catch {
      return { ...defaultPermissions }
    }
  }

  const handlePermissionChange = (key: keyof Permissions, value: boolean) => {
    setAdminForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }))
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/super-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adminForm,
          permissions: adminForm.role === 'admin' ? adminForm.permissions : null
        })
      })
      if (response.ok) {
        toast.success('تم إضافة المشرف بنجاح')
        setShowAddAdmin(false)
        setAdminForm({ name: '', email: '', password: '', role: 'admin', permissions: { ...defaultPermissions } })
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return
    try {
      const response = await fetch(`/api/super-admin/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminForm.name,
          email: adminForm.email,
          password: adminForm.password || undefined,
          role: adminForm.role,
          permissions: adminForm.role === 'admin' ? adminForm.permissions : null
        })
      })
      if (response.ok) {
        toast.success('تم تحديث المشرف بنجاح')
        setEditingAdmin(null)
        setAdminForm({ name: '', email: '', password: '', role: 'admin', permissions: { ...defaultPermissions } })
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشرف؟')) return
    try {
      const response = await fetch(`/api/super-admin/admins/${adminId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('تم حذف المشرف بنجاح')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'حدث خطأ')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/member/logout', { method: 'POST' })
    await fetch('/api/admin/logout', { method: 'POST' })
    router.refresh()
    router.push('/login')
  }

  const startEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setAdminForm({
      name: admin.name || '',
      email: admin.email,
      password: '',
      role: admin.role,
      permissions: admin.role === 'admin' ? parsePermissions(admin.permissions) : { ...defaultPermissions }
    })
    setShowAddAdmin(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: '#fdf8f9' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: '#e8b4c4', borderTopColor: '#a8556f' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: '#fdf8f9' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm" style={{ borderColor: '#f0e0e4' }}>
        <div className="container">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' }}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#2d1f26' }}>لوحة تحكم السوبر أدمن</h1>
                <p className="text-xs font-medium" style={{ color: '#6b5a60' }}>مرحباً {currentAdmin?.name || 'الأدمن'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline" className="gap-2 rounded-full">
                  <Users className="w-4 h-4" />
                  لوحة التحكم الرئيسية
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="gap-2 rounded-full">
                  <ArrowRight className="w-4 h-4" />
                  الصفحة الرئيسية
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" className="gap-2 rounded-full text-red-500">
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="rounded-2xl border-0 shadow-md" style={{ background: 'white' }}>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-3" style={{ color: '#a8556f' }} />
                <div className="text-3xl font-bold" style={{ color: '#2d1f26' }}>{stats.totalMembers}</div>
                <div className="text-sm" style={{ color: '#6b5a60' }}>الأعضاء</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-md" style={{ background: 'white' }}>
              <CardContent className="p-6 text-center">
                <Crown className="w-8 h-8 mx-auto mb-3" style={{ color: '#a8556f' }} />
                <div className="text-3xl font-bold" style={{ color: '#2d1f26' }}>{stats.totalEvents}</div>
                <div className="text-sm" style={{ color: '#6b5a60' }}>اللقاءات</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-md" style={{ background: 'white' }}>
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: '#c9a066' }} />
                <div className="text-3xl font-bold" style={{ color: '#2d1f26' }}>{stats.totalSponsors}</div>
                <div className="text-sm" style={{ color: '#6b5a60' }}>طلبات الرعاية</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-md" style={{ background: 'white' }}>
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 mx-auto mb-3" style={{ color: '#0891b2' }} />
                <div className="text-3xl font-bold" style={{ color: '#2d1f26' }}>{stats.totalAdmins}</div>
                <div className="text-sm" style={{ color: '#6b5a60' }}>المشرفين</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admins Management */}
        <Card className="rounded-3xl border-0 shadow-xl mb-8" style={{ background: 'white' }}>
          <CardHeader className="p-6 border-b" style={{ borderColor: '#f0e0e4' }}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl" style={{ color: '#2d1f26' }}>إدارة المشرفين</CardTitle>
              <Button 
                onClick={() => { 
                  setShowAddAdmin(true); 
                  setEditingAdmin(null);
                  setAdminForm({ name: '', email: '', password: '', role: 'admin', permissions: { ...defaultPermissions } });
                }}
                className="btn btn-primary rounded-full gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة مشرف جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Add/Edit Form */}
            {(showAddAdmin || editingAdmin) && (
              <div className="mb-6 p-6 rounded-2xl" style={{ background: '#fdf8f9', border: '1px solid #f0e0e4' }}>
                <h3 className="font-bold mb-4" style={{ color: '#2d1f26' }}>
                  {editingAdmin ? 'تعديل المشرف' : 'إضافة مشرف جديد'}
                </h3>
                <form onSubmit={editingAdmin ? handleUpdateAdmin : handleAddAdmin} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: '#2d1f26' }}>الاسم</Label>
                      <Input 
                        value={adminForm.name}
                        onChange={e => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-2 h-12 rounded-xl"
                        placeholder="اسم المشرف"
                      />
                    </div>
                    <div>
                      <Label style={{ color: '#2d1f26' }}>البريد الإلكتروني *</Label>
                      <Input 
                        type="email"
                        value={adminForm.email}
                        onChange={e => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="mt-2 h-12 rounded-xl"
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div>
                      <Label style={{ color: '#2d1f26' }}>{editingAdmin ? 'كلمة المرور الجديدة (اتركه فارغ للإبقاء)' : 'كلمة المرور *'}</Label>
                      <div className="relative mt-2">
                        <Input 
                          type={showPassword ? 'text' : 'password'}
                          value={adminForm.password}
                          onChange={e => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                          required={!editingAdmin}
                          className="h-12 rounded-xl pr-12"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: '#6b5a60' }}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label style={{ color: '#2d1f26' }}>نوع الحساب</Label>
                      <select 
                        value={adminForm.role}
                        onChange={e => setAdminForm(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full h-12 mt-2 rounded-xl px-4 border"
                        style={{ borderColor: '#f0e0e4' }}
                      >
                        <option value="admin">مشرف</option>
                        <option value="super_admin">سوبر أدمن (صلاحيات كاملة)</option>
                      </select>
                    </div>
                  </div>

                  {/* Permissions Section - Only for regular admin */}
                  {adminForm.role === 'admin' && (
                    <div className="mt-6">
                      <Label className="text-base font-bold mb-3 block" style={{ color: '#2d1f26' }}>
                        <Lock className="w-4 h-4 inline ml-2" />
                        الصلاحيات التفصيلية
                      </Label>
                      <p className="text-sm mb-4" style={{ color: '#6b5a60' }}>
                        حدد الصلاحيات التي يملكها هذا المشرف
                      </p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PERMISSION_OPTIONS.map((perm) => {
                          const Icon = perm.icon
                          const isEnabled = adminForm.permissions[perm.key as keyof Permissions]
                          return (
                            <div 
                              key={perm.key}
                              onClick={() => handlePermissionChange(perm.key as keyof Permissions, !isEnabled)}
                              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                                isEnabled 
                                  ? 'shadow-md' 
                                  : 'opacity-60 hover:opacity-80'
                              }`}
                              style={{ 
                                background: isEnabled ? '#fdf2f4' : 'white',
                                borderColor: isEnabled ? '#a8556f' : '#f0e0e4'
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}
                                  style={{ background: isEnabled ? '#a8556f' : '#f0e0e4' }}>
                                  <Icon className="w-5 h-5" style={{ color: isEnabled ? 'white' : '#6b5a60' }} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm" style={{ color: '#2d1f26' }}>
                                      {perm.label}
                                    </span>
                                    {isEnabled ? (
                                      <Unlock className="w-4 h-4" style={{ color: '#a8556f' }} />
                                    ) : (
                                      <Lock className="w-4 h-4" style={{ color: '#9a8a90' }} />
                                    )}
                                  </div>
                                  <p className="text-xs mt-1" style={{ color: '#6b5a60' }}>
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Super Admin Notice */}
                  {adminForm.role === 'super_admin' && (
                    <div className="mt-4 p-4 rounded-xl" style={{ background: '#e0f7fa', border: '1px solid #0891b2' }}>
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" style={{ color: '#0891b2' }} />
                        <span className="font-medium" style={{ color: '#0891b2' }}>
                          سوبر أدمن يمتلك جميع الصلاحيات تلقائياً
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button type="submit" className="btn btn-primary rounded-full">
                      {editingAdmin ? 'حفظ التعديلات' : 'إضافة المشرف'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => { setShowAddAdmin(false); setEditingAdmin(null); }}
                      className="rounded-full"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Admins List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#fdf8f9' }}>
                    <th className="text-right p-4 rounded-r-xl" style={{ color: '#2d1f26' }}>الاسم</th>
                    <th className="text-right p-4" style={{ color: '#2d1f26' }}>البريد الإلكتروني</th>
                    <th className="text-right p-4" style={{ color: '#2d1f26' }}>النوع</th>
                    <th className="text-right p-4" style={{ color: '#2d1f26' }}>الصلاحيات</th>
                    <th className="text-right p-4" style={{ color: '#2d1f26' }}>تاريخ الإنشاء</th>
                    <th className="text-center p-4 rounded-l-xl" style={{ color: '#2d1f26' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => {
                    const adminPerms = parsePermissions(admin.permissions)
                    const enabledPerms = Object.entries(adminPerms).filter(([_, v]) => v).length
                    
                    return (
                      <tr key={admin.id} className="border-b" style={{ borderColor: '#f0e0e4' }}>
                        <td className="p-4" style={{ color: '#2d1f26' }}>{admin.name || '-'}</td>
                        <td className="p-4" style={{ color: '#6b5a60' }}>{admin.email}</td>
                        <td className="p-4">
                          <Badge 
                            className="rounded-full"
                            style={{ 
                              background: admin.role === 'super_admin' ? '#0891b2' : '#fdf2f4',
                              color: admin.role === 'super_admin' ? 'white' : '#a8556f'
                            }}
                          >
                            {admin.role === 'super_admin' ? 'سوبر أدمن' : 'مشرف'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {admin.role === 'super_admin' ? (
                            <Badge className="rounded-full" style={{ background: '#e0f7fa', color: '#0891b2' }}>
                              جميع الصلاحيات
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {enabledPerms === 6 ? (
                                <Badge className="rounded-full text-xs" style={{ background: '#e0f0e4', color: '#2d6b3d' }}>
                                  جميع الصلاحيات
                                </Badge>
                              ) : (
                                <>
                                  {adminPerms.events && (
                                    <Badge className="rounded-full text-xs" style={{ background: '#fdf2f4', color: '#a8556f' }}>
                                      اللقاءات
                                    </Badge>
                                  )}
                                  {adminPerms.members && (
                                    <Badge className="rounded-full text-xs" style={{ background: '#fdf2f4', color: '#a8556f' }}>
                                      الأعضاء
                                    </Badge>
                                  )}
                                  {adminPerms.registrations && (
                                    <Badge className="rounded-full text-xs" style={{ background: '#fdf2f4', color: '#a8556f' }}>
                                      التسجيلات
                                    </Badge>
                                  )}
                                  {adminPerms.sponsors && (
                                    <Badge className="rounded-full text-xs" style={{ background: '#fdf2f4', color: '#a8556f' }}>
                                      الرعاة
                                    </Badge>
                                  )}
                                  {adminPerms.settings && (
                                    <Badge className="rounded-full text-xs" style={{ background: '#fdf2f4', color: '#a8556f' }}>
                                      الإعدادات
                                    </Badge>
                                  )}
                                  {adminPerms.export && (
                                    <Badge className="rounded-full text-xs" style={{ background: '#fdf2f4', color: '#a8556f' }}>
                                      التصدير
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4" style={{ color: '#6b5a60' }}>
                          {new Date(admin.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'latn' })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => startEdit(admin)}
                              className="rounded-full"
                            >
                              <Edit className="w-4 h-4" style={{ color: '#0891b2' }} />
                            </Button>
                            {admin.role !== 'super_admin' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="rounded-full"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
