import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// POST - تسجيل دخول الإدارة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // البحث عن المسؤول
    const admin = await db.admin.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // التحقق من كلمة المرور - طرق متعددة
    let isValidPassword = false
    
    // الطريقة 1: مقارنة مباشرة (لكلمات المرور غير المشفرة)
    if (admin.password === password) {
      isValidPassword = true
    }
    // الطريقة 2: bcrypt مقارنة (لكلمات المرور المشفرة)
    else if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
      try {
        isValidPassword = await bcrypt.compare(password, admin.password)
      } catch {
        // ignore
      }
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // إنشاء جلسة
    const cookieStore = await cookies()

    // حذف الكوكي القديم أولاً
    cookieStore.delete('admin-session')

    // إعدادات الـ cookie
    cookieStore.set('admin-session', admin.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // أسبوع
      path: '/',
    })

    return NextResponse.json({ 
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('❌ Error logging in:', error)
    
    // تفاصيل أكثر للتصحيح
    let errorDetails = 'Unknown error'
    if (error instanceof Error) {
      errorDetails = error.message
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء تسجيل الدخول', 
        details: errorDetails
      },
      { status: 500 }
    )
  }
}
