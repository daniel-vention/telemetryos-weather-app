import type { ReactNode } from 'react'

type IconCategory = 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog' | 'night'

/** Map OpenWeatherMap condition id (200-804) to icon category. */
export function openWeatherIdToCategory(id: number): IconCategory {
  if (id >= 200 && id <= 232) return 'storm'
  if (id >= 300 && id <= 321) return 'rain'
  if (id >= 500 && id <= 531) return 'rain'
  if (id >= 600 && id <= 622) return 'snow'
  if (id >= 701 && id <= 781) return 'fog'
  if (id === 800) return 'sun'
  if (id >= 801 && id <= 804) return 'cloud'
  return 'cloud'
}

/** Map weatherCode (WMO or OpenWeather id) to simple category for SVG. */
export function getWeatherIconCategory(weatherCode: number): IconCategory {
  if (weatherCode >= 200) return openWeatherIdToCategory(weatherCode)
  if (weatherCode === 45 || weatherCode === 48) return 'fog'
  if (weatherCode >= 95 && weatherCode <= 99) return 'storm'
  if (weatherCode >= 51 && weatherCode <= 67) return 'rain'
  if (weatherCode >= 71 && weatherCode <= 77) return 'snow'
  if (weatherCode >= 80 && weatherCode <= 82) return 'rain'
  if (weatherCode >= 2 && weatherCode <= 3) return 'cloud'
  if (weatherCode === 0 || weatherCode === 1) return 'sun'
  return 'cloud'
}

/** Simple high-contrast SVG weather icon. */
export function WeatherIconSvg({
  category,
  className,
  sizeRem = 6,
}: {
  category: 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog' | 'night'
  className?: string
  sizeRem?: number
}): ReactNode {
  const s = sizeRem
  const stroke = Math.max(0.15 * s, 0.2)
  const fill = 'currentColor'

  switch (category) {
    case 'sun':
      return (
        <svg className={className} viewBox="0 0 24 24" width={`${s}rem`} height={`${s}rem`} aria-hidden>
          <circle cx="12" cy="12" r="4" fill={fill} stroke={fill} strokeWidth={stroke} />
          <path stroke={fill} strokeWidth={stroke} fill="none" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case 'cloud':
      return (
        <svg className={className} viewBox="0 0 24 24" width={`${s}rem`} height={`${s}rem`} aria-hidden>
          <path fill={fill} d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      )
    case 'rain':
      return (
        <svg className={className} viewBox="0 0 24 24" width={`${s}rem`} height={`${s}rem`} aria-hidden>
          <path fill={fill} d="M6 14c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" />
          <path fill={fill} d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          <path stroke={fill} strokeWidth={stroke} fill="none" d="M8 19v2M12 21v2M16 19v2" />
        </svg>
      )
    case 'snow':
      return (
        <svg className={className} viewBox="0 0 24 24" width={`${s}rem`} height={`${s}rem`} aria-hidden>
          <path fill={fill} d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          <path stroke={fill} strokeWidth={stroke} d="M12 16v2M10 15l-1 1M14 15l1 1M12 18v2M10 17l-1 1M14 17l1 1" />
        </svg>
      )
    case 'storm':
      return (
        <svg className={className} viewBox="0 0 24 24" width={`${s}rem`} height={`${s}rem`} aria-hidden>
          <path fill={fill} d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          <path fill={fill} d="M14 13l-4 6h3l-2 2 5-6h-3z" />
        </svg>
      )
    case 'fog':
      return (
        <svg className={className} viewBox="0 0 24 24" width={`${s}rem`} height={`${s}rem`} aria-hidden>
          <path fill={fill} d="M3 15h18v2H3zM3 19h12v2H3zM3 11h15v2H3z" />
        </svg>
      )
    case 'night':
      return (
        <svg className={className} viewBox="0 0 24 24" width={`${s}rem`} height={`${s}rem`} aria-hidden>
          <path fill={fill} d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      )
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" width={`${s}rem`} height={`${s}rem`} aria-hidden>
          <circle cx="12" cy="12" r="4" fill={fill} />
        </svg>
      )
  }
}
