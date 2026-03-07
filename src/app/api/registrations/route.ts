import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'

// GET - جلب جميع التسجيلات (للإدارة)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    
    const where: Record<string, unknown> = {}
    if (eventId) where.eventId = eventId
    if (status) where.status = status

    const registrations = await db.eventRegistration.findMany({
      where,
      include: {
        event: {
          select: {
            title: true,
            date: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ registrations })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التسجيلات' },
      { status: 500 }
    )
  }
}

// POST - تسجيل جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, name, email, phone, companyName, jobTitle, interests, expectations, status, memberId } = body

    if (!eventId || !name) {
      return NextResponse.json(
        { error: 'الحدث والاسم مطلوبان' },
        { status: 400 }
      )
    }

    // التحقق من وجود الحدث
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: { where: { status: { not: 'cancelled' } } } }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'الحدث غير موجود' },
        { status: 404 }
      )
    }

    // التحقق من السعة
    if (event._count.registrations >= event.capacity) {
      return NextResponse.json(
        { error: 'عذراً، تم استيفاء عدد المسجلين لهذا اللقاء' },
        { status: 400 }
      )
    }

    // استخدام بريد إلكتروني placeholder إذا لم يتم توفيره
    const finalEmail = email && email.trim() !== '' ? email : `no-email-${Date.now()}@placeholder.com`

    // التحقق من عدم التسجيل المسبق (فقط إذا تم توفير بريد إلكتروني حقيقي)
    if (email && email.trim() !== '') {
      const existingRegistration = await db.eventRegistration.findFirst({
        where: {
          eventId,
          email,
          status: { not: 'cancelled' }
        }
      })

      if (existingRegistration) {
        return NextResponse.json(
          { error: 'أنتِ مسجلة بالفعل في هذا اللقاء' },
          { status: 400 }
        )
      }
    }

    const registration = await db.eventRegistration.create({
      data: {
        eventId,
        memberId: memberId || null, // ربط التسجيل بالعضو إذا كان مسجل دخول
        name,
        email: finalEmail,
        phone,
        companyName,
        jobTitle,
        interests,
        expectations,
        status: status || 'pending'
      }
    })

    // إرسال إيميل ترحيبي إذا كان البريد الإلكتروني حقيقي
    if (email && email.trim() !== '' && !email.includes('placeholder.com')) {
      try {
        await sendWelcomeEmail({
          name,
          email,
          companyName,
          jobTitle
        })
        console.log('Welcome email sent to:', email)
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // لا نوقف التسجيل إذا فشل الإيميل
      }
    }

    return NextResponse.json({ registration }, { status: 201 })
  } catch (error) {
    console.error('Error creating registration:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    )
  }
}
