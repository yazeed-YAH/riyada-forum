import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - إنشاء بيانات تجريبية
export async function GET() {
  try {
    // إنشاء مسؤول
    const existingAdmin = await db.admin.findUnique({
      where: { email: 'admin@riyada-women.com' }
    })

    if (!existingAdmin) {
      await db.admin.create({
        data: {
          email: 'admin@riyada-women.com',
          password: 'admin123', // في الإنتاج يجب استخدام bcrypt
          name: 'مدير الملتقى',
          role: 'super_admin'
        }
      })
    }

    // إنشاء أحداث تجريبية
    const eventsCount = await db.event.count()
    
    if (eventsCount === 0) {
      // حدث قادم
      const nextSunday = new Date()
      nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7))
      nextSunday.setHours(19, 0, 0, 0) // 7 مساءً

      await db.event.create({
        data: {
          title: 'اللقاء الأول: ريادة الأعمال والابتكار',
          description: 'لقاء تعريفي عن ملتقى ريادة وورشة عمل حول أسس بناء المشاريع الناجحة والمستدامة',
          date: nextSunday,
          endTime: '22:00',
          location: 'منابع العمارية - الرياض',
          capacity: 50,
          status: 'upcoming'
        }
      })

      // حدث آخر بعد أسبوعين
      const afterTwoWeeks = new Date(nextSunday)
      afterTwoWeeks.setDate(afterTwoWeeks.getDate() + 14)

      await db.event.create({
        data: {
          title: 'اللقاء الثاني: القيادة والإدارة الفعالة',
          description: 'ورشة عمل حول المهارات القيادية المتقدمة وكيفية بناء فرق عمل فعالة',
          date: afterTwoWeeks,
          endTime: '22:00',
          location: 'سيتم الإعلان عنه لاحقاً',
          capacity: 60,
          status: 'upcoming'
        }
      })

      // حدث سابق
      const pastEvent = new Date()
      pastEvent.setDate(pastEvent.getDate() - 14)
      pastEvent.setHours(19, 0, 0, 0)

      await db.event.create({
        data: {
          title: 'لقاء افتتاحي: يوم المرأة العالمي',
          description: 'اللقاء الافتتاحي للملتقى بمناسبة يوم المرأة العالمي',
          date: pastEvent,
          endTime: '22:00',
          location: 'منابع العمارية - الرياض',
          capacity: 50,
          status: 'completed'
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم إنشاء البيانات التجريبية بنجاح',
      admin: {
        email: 'admin@riyada-women.com',
        password: 'admin123'
      }
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء البيانات التجريبية' },
      { status: 500 }
    )
  }
}
