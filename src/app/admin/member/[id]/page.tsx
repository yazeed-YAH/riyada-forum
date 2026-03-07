'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, Crown, User, Mail, Phone, Building2, Briefcase, 
  Calendar, Clock, Edit, Trash2, MessageCircle, Users, 
  ClipboardList, CheckCircle, HandHeart, List, Twitter, Instagram, Linkedin
} from 'lucide-react'
import { toast } from 'sonner'

interface Registration {
  id: string
  eventId: string
  status: string
  createdAt: string
  event: {
    id: string
    title: string
    date: string
  }
}

interface MemberData {
  id: string
  name: string
  email: string
  phone: string | null
  companyName: string | null
  jobTitle: string | null
  businessType: string | null
  gender: string | null
  imageUrl: string | null
  // Social Media
  twitter: string | null
  instagram: string | null
  linkedin: string | null
  snapchat: string | null
  createdAt: string
  isRegistered: boolean
  // Stats
  registrationsCount: number
  attendedCount: number
  companionsCount: number
  sponsorshipCount: number
  // Data
  registrations: Registration[]
}

export default function MemberProfilePage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  
  const [member, setMember] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemberData()
  }, [memberId])

  const fetchMemberData = async () => {
    try {
      // جلب بيانات العضو
      const membersRes = await fetch('/api/members')
      const membersData = await membersRes.json()
      
      // جلب التسجيلات
      const regsRes = await fetch('/api/registrations')
      const regsData = await regsRes.json()
      
      // جلب طلبات الرعاية
      const sponsorsRes = await fetch('/api/sponsors')
      const sponsorsData = await sponsorsRes.json()
      
      // البحث عن العضو
      const memberData = membersData.members?.find((m: {id: string}) => m.id === memberId)
      
      if (memberData) {
        // البحث عن تسجيلات العضو (بواسطة memberId أو البريد الإلكتروني)
        const memberRegs = regsData.registrations?.filter((r: {memberId: string | null, email: string}) => 
          r.memberId === memberId || r.email === memberData.email
        ) || []
        
        // حساب الإحصائيات
        const registrationsCount = memberRegs.length
        const attendedCount = memberRegs.filter((r: {status: string}) => 
          r.status === 'attended'
        ).length
        
        // البحث عن طلبات الرعاية (بواسطة البريد الإلكتروني)
        const memberSponsors = sponsorsData.sponsors?.filter((s: {email: string}) => 
          s.email === memberData.email
        ) || []
        
        setMember({
          ...memberData,
          isRegistered: true,
          registrationsCount,
          attendedCount,
          companionsCount: 0, // غير متوفر حالياً
          sponsorshipCount: memberSponsors.length,
          registrations: memberRegs
        })
      } else {
        // البحث في التسجيلات (زائر)
        const regData = regsData.registrations?.find((r: {id: string}) => r.id === memberId)
        if (regData) {
          // البحث عن جميع تسجيلات هذا الزائر (بواسطة البريد الإلكتروني)
          const visitorRegs = regsData.registrations?.filter((r: {email: string}) => 
            r.email === regData.email
          ) || []
          
          // البحث عن طلبات الرعاية
          const visitorSponsors = sponsorsData.sponsors?.filter((s: {email: string}) => 
            s.email === regData.email
          ) || []
          
          const attendedCount = visitorRegs.filter((r: {status: string}) => 
            r.status === 'attended'
          ).length
          
          setMember({
            id: regData.id,
            name: regData.name,
            email: regData.email,
            phone: regData.phone,
            companyName: regData.companyName,
            jobTitle: regData.jobTitle,
            businessType: null,
            gender: regData.gender || null,
            imageUrl: regData.imageUrl || null,
            createdAt: regData.createdAt,
            isRegistered: false,
            registrationsCount: visitorRegs.length,
            attendedCount,
            companionsCount: 0,
            sponsorshipCount: visitorSponsors.length,
            registrations: visitorRegs
          })
        } else {
          toast.error('العضو غير موجود')
          router.push('/admin')
        }
      }
    } catch (error) {
      console.error('Error fetching member:', error)
      toast.error('حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!member) return
    
    if (!confirm(`هل أنت متأكد من حذف العضو "${member.name}"؟`)) {
      return
    }

    try {
      if (member.isRegistered) {
        const response = await fetch(`/api/members/${member.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          toast.success('تم حذف العضو بنجاح')
          router.push('/admin?tab=members')
        } else {
          toast.error('حدث خطأ أثناء الحذف')
        }
      } else {
        const response = await fetch(`/api/registrations/${member.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          toast.success('تم حذف العضو بنجاح')
          router.push('/admin?tab=members')
        } else {
          toast.error('حدث خطأ أثناء الحذف')
        }
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fff3cd', color: '#856404', label: 'قيد الانتظار' },
      confirmed: { bg: '#d4edda', color: '#3a7d44', label: 'مؤكد' },
      attended: { bg: '#d1ecf1', color: '#0c5460', label: 'حضر' },
      cancelled: { bg: '#f8d7da', color: '#721c24', label: 'ملغي' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span 
        className="px-3 py-1 rounded-full text-xs font-medium"
        style={{ background: config.bg, color: config.color }}
      >
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: '#fdf8f9' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 mx-auto" style={{ borderColor: '#e8b4c4', borderTopColor: '#a8556f' }}></div>
          <p className="mt-4" style={{ color: '#6b5a60' }}>جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: '#fdf8f9' }}>
        <p style={{ color: '#6b5a60' }}>العضو غير موجود</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: 'linear-gradient(180deg, #fdf8f9 0%, #ffffff 50%, #fdf8f9 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: 'rgba(240, 224, 228, 0.5)' }}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link href="/admin" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #a8556f 0%, #9b7b9a 100%)' }}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#2d1f26' }}>ملتقى ريادة</h1>
                <p className="text-xs font-medium" style={{ color: '#6b5a60' }}>ملف العضو</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin?tab=registrations')} 
                className="gap-2 rounded-full" 
                style={{ color: '#6b5a60' }}
              >
                <Users className="w-5 h-5" />
                قائمة الأعضاء
              </Button>
              <Button variant="ghost" onClick={() => router.push('/admin')} className="gap-2 rounded-full" style={{ color: '#6b5a60' }}>
                <ArrowRight className="w-5 h-5" />
                لوحة التحكم
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Member Header Card */}
          <Card className="rounded-3xl border mb-6 overflow-hidden" style={{ borderColor: '#f0e0e4' }}>
            <CardContent className="p-0">
              {/* Cover */}
              <div className="h-32" style={{ background: 'linear-gradient(135deg, #a8556f 0%, #9b7b9a 100%)' }}></div>
              
              {/* Profile Section */}
              <div className="relative px-8 pb-8">
                {/* Avatar */}
                <div className="absolute -top-16 right-8">
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name} 
                      className="w-32 h-32 rounded-3xl border-4 object-cover shadow-xl"
                      style={{ borderColor: '#fff' }}
                    />
                  ) : (
                    <div 
                      className="w-32 h-32 rounded-3xl border-4 flex items-center justify-center shadow-xl"
                      style={{ borderColor: '#fff', background: 'linear-gradient(135deg, #fdf2f4 0%, #f5e6ea 100%)' }}
                    >
                      <User className="w-16 h-16" style={{ color: '#a8556f' }} />
                    </div>
                  )}
                </div>

                {/* Name and Info */}
                <div className="pt-20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold" style={{ color: '#2d1f26' }}>{member.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                      {member.companyName && (
                        <span className="text-sm" style={{ color: '#6b5a60' }}>{member.companyName}</span>
                      )}
                      {member.jobTitle && (
                        <>
                          <span style={{ color: '#e8d8dc' }}>•</span>
                          <span className="text-sm" style={{ color: '#6b5a60' }}>{member.jobTitle}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge 
                        className="rounded-full px-4 py-1"
                        style={{ background: member.gender === 'female' ? '#fdf2f4' : '#e8f4fd', color: member.gender === 'female' ? '#a8556f' : '#2563eb' }}
                      >
                        {member.gender === 'male' ? '👨 ذكر' : '👩 أنثى'}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {member.phone && (
                      <Button 
                        className="rounded-full gap-2"
                        style={{ background: '#25D366', color: 'white' }}
                        onClick={() => {
                          const phone = member.phone?.replace(/\D/g, '') || '';
                          const waLink = phone.startsWith('966') ? `https://wa.me/${phone}` : `https://wa.me/966${phone.replace(/^0/, '')}`;
                          window.open(waLink, '_blank');
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        واتساب
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className="rounded-full gap-2"
                      style={{ borderColor: '#e8d8dc', color: '#6b5a60' }}
                      onClick={() => router.push(`/admin/member/${member.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                      تعديل البيانات
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* Join Date */}
            <Card className="rounded-2xl border" style={{ borderColor: '#f0e0e4' }}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: '#fdf2f4' }}>
                    <Calendar className="w-6 h-6" style={{ color: '#a8556f' }} />
                  </div>
                  <p className="text-xs" style={{ color: '#9a8a90' }}>تاريخ الانضمام</p>
                  <p className="text-sm font-bold mt-1" style={{ color: '#2d1f26' }}>{formatDate(member.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Registrations Count */}
            <Card className="rounded-2xl border" style={{ borderColor: '#f0e0e4' }}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: '#e8f4fd' }}>
                    <ClipboardList className="w-6 h-6" style={{ color: '#2563eb' }} />
                  </div>
                  <p className="text-xs" style={{ color: '#9a8a90' }}>عدد التسجيلات</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f26' }}>{member.registrationsCount}</p>
                </div>
              </CardContent>
            </Card>

            {/* Attended Count */}
            <Card className="rounded-2xl border" style={{ borderColor: '#f0e0e4' }}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: '#d4edda' }}>
                    <CheckCircle className="w-6 h-6" style={{ color: '#3a7d44' }} />
                  </div>
                  <p className="text-xs" style={{ color: '#9a8a90' }}>مرات الحضور</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f26' }}>{member.attendedCount}</p>
                </div>
              </CardContent>
            </Card>

            {/* Companions Count */}
            <Card className="rounded-2xl border" style={{ borderColor: '#f0e0e4' }}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: '#fff3cd' }}>
                    <Users className="w-6 h-6" style={{ color: '#856404' }} />
                  </div>
                  <p className="text-xs" style={{ color: '#9a8a90' }}>المرافقين</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f26' }}>{member.companionsCount}</p>
                </div>
              </CardContent>
            </Card>

            {/* Sponsorship Count */}
            <Card className="rounded-2xl border" style={{ borderColor: '#f0e0e4' }}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: '#fce4ec' }}>
                    <HandHeart className="w-6 h-6" style={{ color: '#c2185b' }} />
                  </div>
                  <p className="text-xs" style={{ color: '#9a8a90' }}>طلبات الرعاية</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#2d1f26' }}>{member.sponsorshipCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="rounded-2xl border mb-6" style={{ borderColor: '#f0e0e4' }}>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1f26' }}>معلومات التواصل</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#fdf8f9' }}>
                  <Mail className="w-5 h-5" style={{ color: '#a8556f' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#9a8a90' }}>البريد الإلكتروني</p>
                    <p className="font-medium" style={{ color: '#2d1f26' }}>{member.email}</p>
                  </div>
                </div>
                
                {member.phone && (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#fdf8f9' }}>
                    <Phone className="w-5 h-5" style={{ color: '#a8556f' }} />
                    <div>
                      <p className="text-xs" style={{ color: '#9a8a90' }}>رقم الجوال</p>
                      <p className="font-medium" style={{ color: '#2d1f26' }} dir="ltr">{member.phone}</p>
                    </div>
                  </div>
                )}
                
                {member.companyName && (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#fdf8f9' }}>
                    <Building2 className="w-5 h-5" style={{ color: '#a8556f' }} />
                    <div>
                      <p className="text-xs" style={{ color: '#9a8a90' }}>الشركة</p>
                      <p className="font-medium" style={{ color: '#2d1f26' }}>{member.companyName}</p>
                    </div>
                  </div>
                )}
                
                {member.jobTitle && (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#fdf8f9' }}>
                    <Briefcase className="w-5 h-5" style={{ color: '#a8556f' }} />
                    <div>
                      <p className="text-xs" style={{ color: '#9a8a90' }}>المسمى الوظيفي</p>
                      <p className="font-medium" style={{ color: '#2d1f26' }}>{member.jobTitle}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          {(member.twitter || member.instagram || member.linkedin || member.snapchat) && (
            <Card className="rounded-2xl border mb-6" style={{ borderColor: '#f0e0e4' }}>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#2d1f26' }}>السوشل ميديا</h2>
                <div className="flex flex-wrap gap-3">
                  {member.twitter && (
                    <a 
                      href={member.twitter.startsWith('http') ? member.twitter : `https://twitter.com/${member.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
                      style={{ background: '#e8f4fd', color: '#1da1f2' }}
                    >
                      <Twitter className="w-4 h-4" />
                      <span>تويتر</span>
                    </a>
                  )}
                  {member.instagram && (
                    <a 
                      href={member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
                      style={{ background: '#fce4ec', color: '#e1306c' }}
                    >
                      <Instagram className="w-4 h-4" />
                      <span>انستغرام</span>
                    </a>
                  )}
                  {member.linkedin && (
                    <a 
                      href={member.linkedin.startsWith('http') ? member.linkedin : `https://linkedin.com/in/${member.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
                      style={{ background: '#e8f4fd', color: '#0077b5' }}
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>لينكد إن</span>
                    </a>
                  )}
                  {member.snapchat && (
                    <a 
                      href={member.snapchat.startsWith('http') ? member.snapchat : `https://snapchat.com/add/${member.snapchat}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
                      style={{ background: '#fff9e6', color: '#fffc00' }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.809-.329-1.228-.72-1.228-1.153 0-.359.256-.704.704-.854.166-.059.346-.089.54-.089.121 0 .239.015.389.045.36.104.674.179.928.179.209 0 .314-.045.39-.09-.007-.166-.017-.331-.028-.51l-.003-.059c-.104-1.629-.23-3.654.3-4.848 1.58-3.545 4.94-3.82 5.93-3.82z"/>
                      </svg>
                      <span>سناب شات</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registration History */}
          <Card className="rounded-2xl border" style={{ borderColor: '#f0e0e4' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2d1f26' }}>
                  <List className="w-5 h-5" style={{ color: '#a8556f' }} />
                  سجل التسجيلات
                </h2>
                <Badge 
                  className="rounded-full"
                  style={{ background: '#fdf2f4', color: '#a8556f' }}
                >
                  {member.registrations.length} تسجيل
                </Badge>
              </div>
              
              {member.registrations.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {member.registrations.map((reg, index) => (
                    <div 
                      key={reg.id}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: '#fdf8f9' }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: 'linear-gradient(135deg, #a8556f 0%, #9b7b9a 100%)', color: 'white' }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#2d1f26' }}>{reg.event?.title || 'لقاء محذوف'}</p>
                          <p className="text-sm" style={{ color: '#9a8a90' }}>
                            {formatDate(reg.event?.date || reg.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(reg.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: '#e8d8dc' }} />
                  <p style={{ color: '#9a8a90' }}>لا توجد تسجيلات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
