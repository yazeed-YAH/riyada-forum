'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, Clock, Building2, Users, User, Crown, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SponsorRequest {
  id: string
  companyName: string
  contactName: string
  logoUrl: string | null
  status: string
}

interface EventSponsorItem {
  sponsorId: string
  sponsorName: string
  tasks: string
}

interface PreviewData {
  eventForm: {
    title: string
    description: string | null
    date: string
    startTime: string | null
    endTime: string | null
    location: string | null
    imageUrl: string | null
    guestName: string | null
    guestImage: string | null
    guestOrganization: string | null
    guestPosition: string | null
  }
  selectedSponsors: EventSponsorItem[]
  sponsorRequests: SponsorRequest[]
}

// Get preview data from localStorage on client side
function getPreviewData(): PreviewData | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem('invitationPreview')
  return data ? JSON.parse(data) : null
}

export default function InvitationPreviewPage() {
  const [previewData] = useState<PreviewData | null>(() => getPreviewData())
  const [downloading, setDownloading] = useState(false)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  // تحميل الخطوط قبل التصدير
  useEffect(() => {
    const loadFonts = async () => {
      try {
        await document.fonts.ready
        // تحميل خط Cairo
        const font = new FontFace('Cairo', 'url(https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-a1PiKg.woff2)')
        await font.load()
        document.fonts.add(font)
        setFontsLoaded(true)
      } catch (e) {
        console.log('Font loading error, using fallback')
        setFontsLoaded(true)
      }
    }
    loadFonts()
  }, [])

  const handleDownload = async () => {
    const element = document.getElementById('invitation-card')
    if (!element || !previewData) return
    
    setDownloading(true)
    
    try {
      // انتظار تحميل الخطوط
      await document.fonts.ready
      
      // Dynamic import for html2canvas
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#fdf8f9',
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          // التأكد من تطبيق الخط في الصفحة المستنسخة
          const clonedElement = clonedDoc.getElementById('invitation-card')
          if (clonedElement) {
            clonedElement.style.fontFamily = 'Cairo, Arial, sans-serif'
            // تطبيق الخط على جميع العناصر
            const allElements = clonedElement.querySelectorAll('*')
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement
              if (htmlEl.style) {
                htmlEl.style.fontFamily = 'Cairo, Arial, sans-serif'
              }
            })
          }
        }
      })
      
      const link = document.createElement('a')
      link.download = `دعوة-${previewData.eventForm.title || 'لقاء'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
    } catch (error) {
      console.error('Error downloading:', error)
    } finally {
      setDownloading(false)
    }
  }

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8f9' }}>
        <div className="text-center">
          <p className="text-lg" style={{ color: '#6b5a60' }}>جاري تحميل المعاينة...</p>
        </div>
      </div>
    )
  }

  const { eventForm, selectedSponsors, sponsorRequests } = previewData

  // Get sponsor details
  const getSponsorDetails = (sponsorId: string) => {
    return sponsorRequests?.find(s => s.id === sponsorId)
  }

  return (
    <div className="min-h-screen py-8" style={{ background: '#e8e8e8' }} dir="rtl">
      {/* Close and Download Buttons */}
      <div className="fixed top-4 left-4 z-50 flex gap-3">
        <Button 
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-full gap-2 px-6"
          style={{ background: 'linear-gradient(135deg, #a8556f 0%, #9b7b9a 100%)', color: 'white' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {downloading ? 'جاري التنزيل...' : 'تنزيل'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.close()}
          className="rounded-full px-6"
        >
          إغلاق
        </Button>
      </div>

      {/* Invitation Card */}
      <div className="flex justify-center">
        <div 
          id="invitation-card"
          className="shadow-2xl"
          dir="rtl"
          style={{ 
            width: '600px',
            background: 'linear-gradient(180deg, #fdf8f9 0%, #ffffff 100%)',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Cairo, system-ui, -apple-system, sans-serif',
            borderRadius: '20px',
            direction: 'rtl'
          }}
        >
          {/* Top Logos Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '20px',
            width: '100%'
          }}>
            {/* Right - Riyada Logo with Crown */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}>
              {/* Crown Logo */}
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #8b3a52 0%, #6b4a5a 100%)',
                boxShadow: '0 4px 12px rgba(139, 58, 82, 0.3)'
              }}>
                <Crown style={{ width: '26px', height: '26px', color: 'white' }} />
              </div>
              {/* Text below crown */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#8b3a52', lineHeight: 1.2, fontFamily: 'Cairo, sans-serif' }}>ملتقى ريادة</p>
              </div>
            </div>
            
            {/* Left - YAH Logo */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src="/yah-logo.png" 
                  alt="YAH" 
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    objectFit: 'contain'
                  }}
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          </div>

          {/* Header - Fixed */}
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: '#a8556f', fontFamily: 'Cairo, sans-serif' }}>دعوة خاصة</h1>
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#2d1f26', fontFamily: 'Cairo, sans-serif' }}>
              ندعوكم لحضور لقاء سيدات الأعمال
            </p>
          </div>

          {/* Event Title */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px', 
            padding: '12px 24px',
            borderRadius: '14px',
            background: 'rgba(253, 248, 249, 0.9)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#a8556f', fontFamily: 'Cairo, sans-serif' }}>
              {eventForm.title || 'عنوان اللقاء'}
            </h2>
          </div>

          {/* Guest Section */}
          <div style={{ 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: '#a8556f',
              fontFamily: 'Cairo, sans-serif'
            }}>ضيف هذا اللقاء</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              {eventForm.guestImage ? (
                <div style={{ 
                  width: '90px',
                  height: '90px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fdf8f9'
                }}>
                  <img 
                    src={eventForm.guestImage} 
                    alt={eventForm.guestName || ''} 
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div style={{ 
                  width: '90px',
                  height: '90px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fdf8f9'
                }}>
                  <User style={{ width: '45px', height: '45px', color: '#a8556f' }} />
                </div>
              )}
              <div>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#2d1f26', fontFamily: 'Cairo, sans-serif' }}>
                  {eventForm.guestName || 'اسم الضيف'}
                </p>
                <p style={{ fontSize: '12px', color: '#6b5a60', fontFamily: 'Cairo, sans-serif' }}>
                  {eventForm.guestOrganization && eventForm.guestPosition 
                    ? `${eventForm.guestOrganization} - ${eventForm.guestPosition}` 
                    : eventForm.guestOrganization || eventForm.guestPosition || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Hayakum Allah */}
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#a8556f', textAlign: 'center', marginBottom: '15px', fontFamily: 'Cairo, sans-serif' }}>حياكم الله</p>

          {/* Event Info */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {/* Date */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ 
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(253, 248, 249, 0.9)'
              }}>
                <Calendar style={{ width: '18px', height: '18px', color: '#a8556f' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d1f26', fontFamily: 'Cairo, sans-serif' }}>التاريخ</span>
              <span style={{ fontSize: '11px', color: '#6b5a60', fontFamily: 'Cairo, sans-serif' }}>
                {eventForm.date ? new Date(eventForm.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
              </span>
            </div>
            
            {/* Time */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ 
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(253, 248, 249, 0.9)'
              }}>
                <Clock style={{ width: '18px', height: '18px', color: '#a8556f' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d1f26', fontFamily: 'Cairo, sans-serif' }}>الوقت</span>
              <span style={{ fontSize: '11px', color: '#6b5a60', fontFamily: 'Cairo, sans-serif' }}>
                {eventForm.startTime || '18:00'} - {eventForm.endTime || '22:00'}
              </span>
            </div>
            
            {/* Location */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ 
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(253, 248, 249, 0.9)'
              }}>
                <Building2 style={{ width: '18px', height: '18px', color: '#a8556f' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d1f26', fontFamily: 'Cairo, sans-serif' }}>الموقع</span>
              <a 
                href={`https://www.google.com/maps/search/${encodeURIComponent((eventForm.location || 'الرياض') + ' السعودية')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontSize: '11px', color: '#a8556f', fontFamily: 'Cairo, sans-serif', textDecoration: 'underline', cursor: 'pointer' }}
              >
                اضغط هنا
              </a>
            </div>
            
            {/* Women Only */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ 
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(253, 248, 249, 0.9)'
              }}>
                <Users style={{ width: '18px', height: '18px', color: '#a8556f' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d1f26', fontFamily: 'Cairo, sans-serif' }}>للنساء فقط</span>
            </div>
            
            {/* Sponsors */}
            {selectedSponsors && selectedSponsors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ 
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(253, 248, 249, 0.9)'
                }}>
                  <Handshake style={{ width: '18px', height: '18px', color: '#a8556f' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d1f26', fontFamily: 'Cairo, sans-serif' }}>الرعاة</span>
                <span style={{ fontSize: '11px', color: '#6b5a60', fontFamily: 'Cairo, sans-serif' }}>
                  {selectedSponsors.length}
                </span>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <QRCodeSVG 
              value={JSON.stringify({
                event: eventForm.title,
                date: eventForm.date,
                time: `${eventForm.startTime} - ${eventForm.endTime}`,
                location: eventForm.location,
                guest: eventForm.guestName,
                organizer: 'ملتقى ريادة - تجمع سيدات الأعمال'
              })}
              size={70}
              level="H"
              bgColor="#ffffff"
              fgColor="#a8556f"
            />
          </div>

          {/* Sponsors Section */}
          {selectedSponsors && selectedSponsors.length > 0 && (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              {/* Sponsors Button */}
              <div style={{ 
                padding: '6px 20px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #8b3a52 0%, #6b4a5a 100%)',
                boxShadow: '0 2px 8px rgba(139, 58, 82, 0.3)',
                marginBottom: '12px'
              }}>
                <p style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: 'white', 
                  fontFamily: 'Cairo, sans-serif'
                }}>الرعاة</p>
              </div>
              
              {/* Sponsor Logos */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {selectedSponsors.map(sponsor => {
                  const sponsorData = getSponsorDetails(sponsor.sponsorId)
                  return (
                    <div key={sponsor.sponsorId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      {sponsorData?.logoUrl ? (
                        <img 
                          src={sponsorData.logoUrl} 
                          alt={sponsor.sponsorName} 
                          style={{ 
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            objectFit: 'contain'
                          }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div style={{ 
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fdf8f9'
                        }}>
                          <Building2 style={{ width: '20px', height: '20px', color: '#a8556f' }} />
                        </div>
                      )}
                      <span style={{ fontSize: '9px', color: '#2d1f26', textAlign: 'center', maxWidth: '50px', fontFamily: 'Cairo, sans-serif' }}>
                        {sponsor.sponsorName.substring(0, 12)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ 
            marginTop: '15px',
            paddingTop: '12px',
            textAlign: 'center',
            borderTop: '1px solid #f0e0e4'
          }}>
            <p style={{ fontSize: '11px', color: '#9a8a90', fontFamily: 'Cairo, sans-serif' }}>
              ملتقى ريادة - تجمع سيدات الأعمال
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
