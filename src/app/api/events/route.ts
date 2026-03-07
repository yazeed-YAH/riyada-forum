import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع الأحداث
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const eventType = searchParams.get('eventType')
    const adminView = searchParams.get('admin') // للإدارة فقط
    
    const where: Record<string, unknown> = {}
    
    // إذا لم يكن طلب الإدارة، نعرض فقط الأحداث المنشورة
    if (adminView !== 'true') {
      where.isPublished = true
    }
    
    if (status) {
      where.status = status
    }
    if (eventType) {
      where.eventType = eventType
    }

    const events = await db.event.findMany({
      where,
      include: {
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الأحداث' },
      { status: 500 }
    )
  }
}

// POST - إنشاء حدث جديد (للإدارة)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, description, date, startTime, endTime, location, imageUrl,
      status, eventType, isPublished, registrationDeadline,
      guestName, guestImage, guestOrganization, guestPosition,
      guestTwitter, guestInstagram, guestLinkedIn, guestSnapchat,
      capacity, maxCompanions, registrationType, sendQR,
      showCountdown, showRegistrantCount, showGuestProfile, showHospitalityPreference,
      valetServiceEnabled, parkingCapacity, carRetrievalTime
    } = body

    if (!title || !date) {
      return NextResponse.json(
        { error: 'العنوان والتاريخ مطلوبان' },
        { status: 400 }
      )
    }

    const event = await db.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        location,
        imageUrl,
        status: status || 'open',
        eventType: eventType || 'public',
        isPublished: isPublished || false,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        guestName,
        guestImage,
        guestOrganization,
        guestPosition,
        guestTwitter,
        guestInstagram,
        guestLinkedIn,
        guestSnapchat,
        capacity: capacity || 50,
        maxCompanions: maxCompanions || 0,
        registrationType: registrationType || 'registration',
        sendQR: sendQR || false,
        showCountdown: showCountdown ?? true,
        showRegistrantCount: showRegistrantCount ?? true,
        showGuestProfile: showGuestProfile ?? true,
        showHospitalityPreference: showHospitalityPreference ?? true,
        valetServiceEnabled: valetServiceEnabled || false,
        parkingCapacity: parkingCapacity || null,
        carRetrievalTime: carRetrievalTime || null
      }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحدث' },
      { status: 500 }
    )
  }
}
