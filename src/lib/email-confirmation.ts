import { db } from '@/lib/db'

interface EventData {
  id: string
  title: string
  date: Date
  startTime: string | null
  endTime: string | null
  location: string | null
  guestName: string | null
  guestImage?: string | null
  guestOrganization: string | null
  guestPosition: string | null
}

interface SponsorData {
  sponsorId: string
  sponsorName: string
  logoUrl?: string | null
  websiteUrl?: string | null
}

interface SendConfirmationEmailParams {
  to: string
  name: string
  event: EventData
  sponsors: SponsorData[]
}

interface EmailResult {
  success: boolean
  error?: string
  details?: string
}

// Format time to 12-hour format with Arabic
function formatTime12(time: string | null): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'م' : 'ص'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Format date to Arabic
function formatDateArabic(date: Date): string {
  return date.toLocaleDateString('ar-SA', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// دالة لإرسال إيميل تأكيد القبول
export async function sendConfirmationEmail(params: SendConfirmationEmailParams): Promise<EmailResult> {
  try {
    console.log('=== Starting sendConfirmationEmail ===')
    console.log('Recipient:', params.to)
    console.log('Name:', params.name)
    console.log('Event:', params.event.title)

    const resendApiKey = process.env.RESEND_API_KEY
    console.log('RESEND_API_KEY exists:', !!resendApiKey)
    
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email send')
      return { success: false, error: 'RESEND_API_KEY غير موجود', details: 'يجب إضافة مفتاح Resend API في متغيرات البيئة' }
    }

    // جلب إعدادات الإيميل
    const settings = await db.siteSettings.findMany({
      where: {
        key: {
          startsWith: 'email_'
        }
      }
    })
    
    const emailSettings: Record<string, string> = {}
    settings.forEach(setting => {
      const key = setting.key.replace('email_', '')
      emailSettings[key] = setting.value
    })
    console.log('Email settings loaded:', Object.keys(emailSettings).length, 'settings')

    const eventDateStr = formatDateArabic(new Date(params.event.date))
    const eventTimeStr = params.event.startTime 
      ? `${formatTime12(params.event.startTime)} - ${formatTime12(params.event.endTime)}`
      : ''

    const subject = `تم تأكيد تسجيلك في ${params.event.title} 👑`

    // بناء HTML للرعاة - مع دعم الصور
    let sponsorsHtml = ''
    if (params.sponsors.length > 0) {
      const sponsorItems = params.sponsors.map(s => {
        if (s.logoUrl) {
          // إذا يوجد شعار، نعرضه كصورة
          return `
            <td style="background: white; padding: 16px 20px; border-radius: 8px; text-align: center; vertical-align: middle;">
              <img src="${s.logoUrl}" alt="${s.sponsorName}" style="height: 50px; max-width: 120px; width: auto; display: block; margin: 0 auto;" />
            </td>
          `
        } else {
          // إذا ما يوجد شعار، نعرض اسم الراعي
          return `
            <td style="background: white; padding: 16px 20px; border-radius: 8px; text-align: center; vertical-align: middle;">
              <span style="color: #a8556f; font-size: 14px; font-weight: 600; white-space: nowrap;">${s.sponsorName}</span>
            </td>
          `
        }
      }).join('<td style="width: 12px;"></td>\n')
      
      sponsorsHtml = `
        <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #fdf2f4 0%, #fdf8f9 100%); border-radius: 12px; text-align: center;">
          <p style="color: #a8556f; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">✨ برعاية</p>
          <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              ${sponsorItems}
            </tr>
          </table>
        </div>
      `
    }

    // بناء HTML لضيف الشرف
    const guestHtml = params.event.guestName ? `
      <div style="text-align: center; margin: 20px 0; padding: 16px; background: #fdf8f9; border-radius: 12px;">
        <p style="color: #a8556f; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">ضيف الشرف</p>
        <p style="color: #2d1f26; margin: 0; font-size: 18px; font-weight: 600;">${params.event.guestName}</p>
        ${params.event.guestOrganization ? `<p style="color: #6b5a60; margin: 4px 0 0 0; font-size: 14px;">${params.event.guestOrganization}</p>` : ''}
        ${params.event.guestPosition ? `<p style="color: #a8556f; margin: 4px 0 0 0; font-size: 14px;">${params.event.guestPosition}</p>` : ''}
      </div>
    ` : ''

    const html = `
      <div style="text-align: right; direction: rtl; font-family: Arial, Helvetica, sans-serif;">
        <h2 style="color: #2d1f26; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
          مبارك ${params.name}! تم تأكيد تسجيلك ✨
        </h2>
        
        <p style="color: #6b5a60; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
          يسعدنا إبلاغك بأنه <strong style="color: #3a7d44;">تم تأكيد تسجيلك</strong> في:
        </p>
        
        <div style="background: linear-gradient(135deg, #fdf2f4 0%, #fff 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 2px solid #f0e0e4;">
          <h3 style="color: #a8556f; margin: 0 0 16px 0; font-size: 22px; font-weight: 700; text-align: center;">
            ${params.event.title}
          </h3>
          
          ${guestHtml}
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
            <tr>
              <td style="text-align: center; padding: 12px;">
                <p style="color: #a8556f; margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">📅 التاريخ</p>
                <p style="color: #2d1f26; margin: 0; font-size: 14px;">${eventDateStr}</p>
              </td>
              <td style="width: 1px; background: #f0e0e4;"></td>
              <td style="text-align: center; padding: 12px;">
                <p style="color: #a8556f; margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">⏰ الوقت</p>
                <p style="color: #2d1f26; margin: 0; font-size: 14px;">${eventTimeStr || 'غير محدد'}</p>
              </td>
              <td style="width: 1px; background: #f0e0e4;"></td>
              <td style="text-align: center; padding: 12px;">
                <p style="color: #a8556f; margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">📍 الموقع</p>
                <p style="color: #2d1f26; margin: 0; font-size: 14px;">${params.event.location || 'سيتم تحديده'}</p>
              </td>
            </tr>
          </table>
        </div>
        
        ${sponsorsHtml}
        
        <div style="background: #e8f5e9; border-radius: 12px; padding: 16px; margin: 20px 0; border-right: 4px solid #3a7d44;">
          <p style="color: #2e7d32; margin: 0; font-size: 15px; font-weight: 600;">
            📎 مرفق مع هذا الإيميل دعوتك الخاصة بصيغة PDF
          </p>
          <p style="color: #558b2f; margin: 8px 0 0 0; font-size: 13px;">
            يرجى إحضار الدعوة أو عرضها على جوالك عند الحضور
          </p>
        </div>
        
        <p style="color: #6b5a60; font-size: 15px; line-height: 1.8; margin: 16px 0;">
          ننتظرك في هذا اللقاء المميز! 💜
        </p>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://riyada.yplus.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #a8556f 0%, #9b7b9a 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">
            زيارة الملتقى
          </a>
        </div>
      </div>
    `

    // بناء HTML الكامل مع الهيدر والفوتر
    const fullHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="direction: rtl; text-align: right; font-family: Arial, Helvetica, sans-serif; background: #f5f5f9; padding: 20px; margin: 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="direction: rtl;">
          <tr>
            <td align="center" style="padding: 0;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background: ${emailSettings.headerBackgroundColor || '#fdf8f9'}; padding: 32px 24px; text-align: center;">
                    ${emailSettings.headerLogo ? `<img src="${emailSettings.headerLogo}" alt="ملتقى ريادة" style="max-height: 80px; margin-bottom: 16px;" />` : ''}
                    <h1 style="color: ${emailSettings.headerTextColor || '#2d1f26'}; margin: 0; font-size: 28px; font-weight: bold;">ملتقى ريادة</h1>
                    <p style="color: #a8556f; font-size: 16px; margin: 8px 0 0 0;">تجمع سيدات الأعمال</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="background: #ffffff; padding: 32px 24px; direction: rtl; text-align: right;">
                    ${html}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: ${emailSettings.footerBackgroundColor || '#fdf8f9'}; padding: 24px; text-align: center;">
                    <p style="color: ${emailSettings.footerTextColor || '#6b5a60'}; margin: 0; font-size: 14px;">${emailSettings.footerText || 'ملتقى ريادة - تجمع سيدات الأعمال'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const fromName = 'ملتقى ريادة'
    
    console.log('From:', `${fromName} <${fromEmail}>`)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [params.to],
        subject: subject,
        html: fullHtml,
      }),
    })

    const responseText = await response.text()
    console.log('Resend API response status:', response.status)
    console.log('Resend API response:', responseText)
    
    if (response.ok) {
      console.log('Confirmation email sent successfully to:', params.to)
      return { success: true }
    } else {
      console.error('Failed to send confirmation email:', responseText)
      let errorDetails = responseText
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = errorJson.message || errorJson.error?.message || responseText
      } catch {
        // Keep original text if not JSON
      }
      return { 
        success: false, 
        error: 'فشل إرسال الإيميل', 
        details: errorDetails
      }
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return { 
      success: false, 
      error: 'خطأ في الاتصال', 
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }
  }
}

// دالة لإرسال إيميل تأكيد القبول مع جلب البيانات من قاعدة البيانات
export async function sendConfirmationEmailForRegistration(registrationId: string): Promise<EmailResult> {
  try {
    // جلب بيانات التسجيل والفعالية
    const registration = await db.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            startTime: true,
            endTime: true,
            location: true,
            guestName: true,
            guestImage: true,
            guestOrganization: true,
            guestPosition: true,
          }
        }
      }
    })

    if (!registration) {
      return { success: false, error: 'التسجيل غير موجود' }
    }

    // التحقق من البريد الإلكتروني
    if (!registration.email || registration.email.includes('placeholder.com')) {
      return { success: false, error: 'لا يوجد بريد إلكتروني صالح' }
    }

    // جلب رعاة الفعالية
    const eventSponsors = await db.eventSponsor.findMany({
      where: { eventId: registration.eventId },
      include: {
        sponsor: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            websiteUrl: true,
          }
        }
      }
    })

    const sponsors = eventSponsors.map(es => ({
      sponsorId: es.sponsor.id,
      sponsorName: es.sponsor.companyName,
      logoUrl: es.sponsor.logoUrl,
      websiteUrl: es.sponsor.websiteUrl,
    }))

    // إرسال الإيميل
    return await sendConfirmationEmail({
      to: registration.email,
      name: registration.name,
      event: registration.event,
      sponsors,
    })
  } catch (error) {
    console.error('Error in sendConfirmationEmailForRegistration:', error)
    return { 
      success: false, 
      error: 'خطأ في جلب البيانات', 
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }
  }
}
