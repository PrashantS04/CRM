import { buildCallHref, buildEmailHref, isMobileDevice } from './contact'

describe('contact links (brief §3.6.2 / §3.6.3)', () => {
  it('uses the phone dialler on mobile', () => {
    expect(buildCallHref('+61 412 830 412', true)).toBe('tel:+61412830412')
  })

  it('uses Microsoft Teams on desktop', () => {
    expect(buildCallHref('+61 412 830 412', false)).toBe('msteams:/l/call/0/0?users=4:+61412830412')
  })

  it('builds a mailto link', () => {
    expect(buildEmailHref('a@b.com')).toBe('mailto:a@b.com')
  })

  it('detects mobile user agents', () => {
    expect(isMobileDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true)
    expect(isMobileDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false)
  })
})
