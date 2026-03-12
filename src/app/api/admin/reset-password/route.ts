import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور الجديدة مطلوبان' },
        { status: 400 }
      )
    }

    // التحقق من وجود الحساب
    const admin = await db.admin.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'الحساب غير موجود' },
        { status: 404 }
      )
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // تحديث كلمة المرور
    await db.admin.update({
      where: { email: email.toLowerCase().trim() },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث كلمة المرور' },
      { status: 500 }
    )
  }
}
