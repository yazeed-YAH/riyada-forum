import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// POST - تسجيل دخول الإدارة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('🔐 Admin login attempt:', { email, password: password ? '***' : 'missing' })

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

    console.log('👤 Admin found:', admin ? 'YES' : 'NO')

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
      console.log('✅ Direct match')
    }
    // الطريقة 2: bcrypt مقارنة (لكلمات المرور المشفرة)
    else if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
      try {
        isValidPassword = await bcrypt.compare(password, admin.password)
        console.log('✅ Bcrypt result:', isValidPassword)
      } catch (e) {
        console.log('❌ Bcrypt error:', e)
      }
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password')
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    console.log('✅ Login successful for:', email)

    // إنشاء جلسة - إعدادات مبسطة
    const cookieStore = await cookies()
    
    cookieStore.set('admin-session', admin.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
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
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    )
  }
}
