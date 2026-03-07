import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    const recipientEmail = email || 'yazeed@yah.sa'
    const recipientName = name || 'يزيد'

    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY غير موجود في متغيرات البيئة' },
        { status: 500 }
      )
    }

    console.log('=== Sending test email ===')
    console.log('To:', recipientEmail)
    console.log('Name:', recipientName)

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `ملتقى ريادة <${fromEmail}>`,
        to: [recipientEmail],
        subject: `تم تأكيد تسجيلك في ملتقى ريادة 👑`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="direction: rtl; text-align: right; font-family: Arial, Helvetica, sans-serif; background: #f5f5f9; padding: 20px; margin: 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="direction: rtl;">
              <tr>
                <td align="center" style="padding: 0;">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                      <td style="background: #fdf8f9; padding: 32px 24px; text-align: center;">
                        <h1 style="color: #2d1f26; margin: 0; font-size: 28px; font-weight: bold;">ملتقى ريادة</h1>
                        <p style="color: #a8556f; font-size: 16px; margin: 8px 0 0 0;">تجمع سيدات الأعمال</p>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="background: #ffffff; padding: 32px 24px; direction: rtl; text-align: right;">
                        <h2 style="color: #2d1f26; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                          مبارك ${recipientName}! تم تأكيد تسجيلك ✨
                        </h2>
                        
                        <p style="color: #6b5a60; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
                          يسعدنا إبلاغك بأنه <strong style="color: #3a7d44;">تم تأكيد تسجيلك</strong> في:
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #fdf2f4 0%, #fff 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 2px solid #f0e0e4;">
                          <h3 style="color: #a8556f; margin: 0 0 16px 0; font-size: 22px; font-weight: 700; text-align: center;">
                            اللقاء الافتتاحي
                          </h3>
                          
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                            <tr>
                              <td style="text-align: center; padding: 12px;">
                                <p style="color: #a8556f; margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">التاريخ</p>
                                <p style="color: #2d1f26; margin: 0; font-size: 14px;">الجمعة 21 مارس 2025</p>
                              </td>
                              <td style="width: 1px; background: #f0e0e4;"></td>
                              <td style="text-align: center; padding: 12px;">
                                <p style="color: #a8556f; margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">الوقت</p>
                                <p style="color: #2d1f26; margin: 0; font-size: 14px;">6:00 م - 10:00 م</p>
                              </td>
                              <td style="width: 1px; background: #f0e0e4;"></td>
                              <td style="text-align: center; padding: 12px;">
                                <p style="color: #a8556f; margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">الموقع</p>
                                <p style="color: #2d1f26; margin: 0; font-size: 14px;">الرياض</p>
                              </td>
                            </tr>
                          </table>
                        </div>
                        
                        <!-- Sponsors Section -->
                        <div style="margin: 24px 0; padding: 16px; background: linear-gradient(135deg, #fdf2f4 0%, #fdf8f9 100%); border-radius: 12px; text-align: center;">
                          <p style="color: #a8556f; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">برعاية</p>
                          <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                              <td style="background: white; padding: 12px 16px; border-radius: 8px; text-align: center;">
                                <span style="color: #a8556f; font-size: 13px; font-weight: 600;">راعي ذهبي</span>
                              </td>
                              <td style="width: 8px;"></td>
                              <td style="background: white; padding: 12px 16px; border-radius: 8px; text-align: center;">
                                <span style="color: #a8556f; font-size: 13px; font-weight: 600;">راعي فضي</span>
                              </td>
                              <td style="width: 8px;"></td>
                              <td style="background: white; padding: 12px 16px; border-radius: 8px; text-align: center;">
                                <span style="color: #a8556f; font-size: 13px; font-weight: 600;">راعي برونزي</span>
                              </td>
                            </tr>
                          </table>
                        </div>
                        
                        <div style="background: #e8f5e9; border-radius: 12px; padding: 16px; margin: 20px 0; border-right: 4px solid #3a7d44;">
                          <p style="color: #2e7d32; margin: 0; font-size: 15px; font-weight: 600;">
                            مرفق مع هذا الإيميل دعوتك الخاصة بصيغة PDF
                          </p>
                          <p style="color: #558b2f; margin: 8px 0 0 0; font-size: 13px;">
                            يرجى إحضار الدعوة أو عرضها على جوالك عند الحضور
                          </p>
                        </div>
                        
                        <p style="color: #6b5a60; font-size: 15px; line-height: 1.8; margin: 16px 0;">
                          ننتظرك في هذا اللقاء المميز!
                        </p>
                        
                        <div style="text-align: center; margin-top: 24px;">
                          <a href="https://riyada.yplus.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #a8556f 0%, #9b7b9a 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">
                            زيارة الملتقى
                          </a>
                        </div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background: #fdf8f9; padding: 24px; text-align: center;">
                        <p style="color: #6b5a60; margin: 0; font-size: 14px;">ملتقى ريادة - تجمع سيدات الأعمال</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    })

    const responseText = await response.text()
    console.log('Resend response status:', response.status)
    console.log('Resend response:', responseText)

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: `تم إرسال الإيميل بنجاح إلى ${recipientEmail}`,
        response: responseText
      })
    } else {
      let errorDetails = responseText
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = errorJson.message || errorJson.error?.message || responseText
      } catch {
        // Keep original text
      }
      return NextResponse.json(
        { error: 'فشل إرسال الإيميل', details: errorDetails },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال الإيميل', details: error instanceof Error ? error.message : 'خطأ غير معروف' },
      { status: 500 }
    )
  }
}
