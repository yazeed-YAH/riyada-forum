import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'riyada-secret-key-2024'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('🔐 Member login attempt:', { email, password: password ? '***' : 'missing' })

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // البحث عن العضو بالبريد
    const member = await db.member.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    console.log('👤 Member found:', member ? 'YES' : 'NO')

    if (!member) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // التحقق من كلمة المرور - طرق متعددة
    let isValidPassword = false
    
    // الطريقة 1: مقارنة مباشرة
    if (member.password === password) {
      isValidPassword = true
      console.log('✅ Direct match')
    }
    // الطريقة 2: bcrypt
    else if (member.password && member.password.startsWith('$2')) {
      try {
        isValidPassword = await bcrypt.compare(password, member.password)
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

    // إنشاء token
    const token = await new SignJWT({
      id: member.id,
      name: member.name,
      email: member.email,
      type: 'member'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(JWT_SECRET)

    // حفظ في cookies
    const cookieStore = await cookies()
    
    cookieStore.set('member-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })

    console.log('✅ Member login successful:', email)

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        companyName: member.companyName,
        jobTitle: member.jobTitle
      }
    })
  } catch (error) {
    console.error('❌ Error logging in member:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    )
  }
}
