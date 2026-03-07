import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST - إعادة تعيين كلمة مرور المسؤول
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    console.log('🔑 Reset password request for:', email)

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور الجديدة مطلوبان' },
        { status: 400 }
      )
    }

    // البحث عن المسؤول
    const admin = await db.admin.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'لم يتم العثور على حساب بهذا البريد الإلكتروني' },
        { status: 404 }
      )
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // تحديث كلمة المرور
    await db.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    })

    console.log('✅ Password reset successful for:', email)

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح',
      email: admin.email
    })
  } catch (error) {
    console.error('❌ Error resetting password:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' },
      { status: 500 }
    )
  }
}
