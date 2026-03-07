import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// Check admin authentication and permissions
export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin-session')?.value

    if (!adminSession) {
      return NextResponse.json({ isAdmin: false, admin: null })
    }

    // جلب بيانات المسؤول
    const admin = await db.admin.findUnique({
      where: { id: adminSession },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true
      }
    })

    if (!admin) {
      return NextResponse.json({ isAdmin: false, admin: null })
    }

    // تحويل الصلاحيات من JSON string إلى object
    let permissions = null
    if (admin.permissions) {
      try {
        permissions = JSON.parse(admin.permissions)
      } catch {
        permissions = null
      }
    }

    return NextResponse.json({ 
      isAdmin: true, 
      admin: {
        ...admin,
        permissions
      }
    })
  } catch (error) {
    console.error('Error checking admin:', error)
    return NextResponse.json({ isAdmin: false, admin: null })
  }
}
