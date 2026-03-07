import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin-session')?.value

    if (!adminSession) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const admin = await db.admin.findUnique({
      where: { id: adminSession }
    })

    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // حساب عدد الأعضاء الفريدين من التسجيلات (عن طريق البريد الإلكتروني الفريد)
    const uniqueRegistrations = await db.eventRegistration.findMany({
      select: { email: true },
      distinct: ['email']
    })
    const totalMembers = uniqueRegistrations.length

    const [totalEvents, totalSponsors, totalAdmins] = await Promise.all([
      db.event.count(),
      db.sponsorRequest.count(),
      db.admin.count()
    ])

    return NextResponse.json({
      totalMembers,
      totalEvents,
      totalSponsors,
      totalAdmins
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
