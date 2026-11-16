import { useEffect, useRef, useState } from 'react'
import intelliatechLogo from '@/assets/png/intelliatech_white_logo.png'
import intelliatechLogo2 from '@/assets/png/intelliatech.png'
import intelliatechIcon from '@/assets/png/Intelliatech-icon.png'

export const WATERMARK_TEXT = 'Developed by '
const INTELLIATECH_URL = 'http://intelliatech.com/'

type WatermarkProps = {
  inline?: boolean
  compact?: boolean
  className?: string
}

const Watermark = ({ inline = false, compact = false, className = '' }: WatermarkProps) => {
  const containerRef = useRef<HTMLAnchorElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (inline) return

    const updateHover = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      setIsHovered(inside)
    }

    const resetHover = () => setIsHovered(false)

    window.addEventListener('mousemove', updateHover)
    window.addEventListener('mouseleave', resetHover)

    return () => {
      window.removeEventListener('mousemove', updateHover)
      window.removeEventListener('mouseleave', resetHover)
    }
  }, [inline])

  const textClassName = inline
    ? 'font-montserrat flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-[10px] font-semibold leading-tight text-white transition-colors group-hover:text-ink md:text-white'
    : `font-montserrat flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[12px] font-semibold leading-tight transition-colors ${
        isHovered ? 'text-ink md:text-white' : 'text-ink md:text-white'
      }`

  const imageClassName = inline
    ? 'h-auto w-[80px] opacity-50 transition-opacity group-hover:opacity-100 md:w-[100px] md:hidden'
    : 'hidden h-auto w-[80px] md:block md:w-[100px]'

  const imageClassName2 = inline
    ? 'h-auto w-[90px] opacity-50 transition-opacity group-hover:opacity-100 md:hidden md:w-[100px]'
    : 'h-auto w-[90px] md:hidden md:w-[100px]'

  if (compact) {
    return (
      <a
        ref={containerRef}
        href={INTELLIATECH_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group mx-auto flex w-9 cursor-pointer select-none items-center justify-center ${className}`}
        aria-label="Intelliatech"
      >
        <img
          src={intelliatechIcon}
          alt="Intelliatech"
          className="h-12 w-12 object-contain opacity-50 transition-opacity group-hover:opacity-100"
        />
      </a>
    )
  }

  return (
    <a
      ref={containerRef}
      href={INTELLIATECH_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={
        inline
          ? `group flex w-full min-w-0 max-w-full cursor-pointer justify-center select-none ${className}`
          : `fixed right-2 bottom-2 z-[99999] cursor-pointer select-none md:right-10 ${className}`
      }
      aria-label="Visit IntelliaTech website"
    >
      <span className={textClassName}>
        {WATERMARK_TEXT}
        <img src={intelliatechLogo} alt="Intellia Tech Logo" className={`${imageClassName} pt-1`} />
        <img src={intelliatechLogo2} alt="Intellia Tech Logo" className={`${imageClassName2} pt-1`} />
      </span>
    </a>
  )
}

export default Watermark
