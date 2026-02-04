import { useEffect, useState, useMemo, useRef } from 'react'
import { media } from '@telemetryos/sdk'
import { useUiScaleToSetRem } from '@telemetryos/sdk/react'
import {
  useLocationModeState,
  useCitiesState,
  useCycleDurationState,
  useTransitionStyleState,
  useTemperatureUnitsState,
  useForecastRangeState,
  useShowDateState,
  useBackgroundTypeState,
  useSolidColorState,
  useGradientColor1State,
  useGradientColor2State,
  useGradientDirectionState,
  useBackgroundImageIdState,
  useBackgroundVideoIdState,
  useOverlayColorState,
  useOverlayOpacityState,
  useUiScaleStoreState,
  useWeatherCacheState,
  type WeatherCacheConditions,
  type WeatherCacheForecastRow,
} from '../hooks/store'
import { useLayoutShape } from '../hooks/useLayoutShape'
import { showP2, showP3, type LayoutShape } from '../utils/layoutShape'
import { getWeatherIconCategory, WeatherIconSvg } from '../utils/weatherIcons'
import { fetchOpenWeather } from '../utils/openweather'
import type { WeatherCacheEntry } from '../hooks/store'
import './Render.css'

function getOpenWeatherApiKey(): string {
  return (import.meta.env?.VITE_OPENWEATHER_API_KEY as string) ?? ''
}

function getBackgroundFromWeather(iconCategory: string): { bg: string } {
  switch (iconCategory) {
    case 'sun':
      return { bg: 'linear-gradient(135deg, #f5a623 0%, #f7dc6f 50%, #e8b923 100%)' }
    case 'cloud':
    case 'fog':
      return { bg: 'linear-gradient(180deg, #5c6b7a 0%, #3d4f5f 100%)' }
    case 'rain':
    case 'storm':
      return { bg: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)' }
    case 'snow':
      return { bg: 'linear-gradient(180deg, #a8d0e6 0%, #d4e8f0 50%, #7eb8da 100%)' }
    case 'night':
      return { bg: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }
    default:
      return { bg: 'linear-gradient(180deg, #4a6fa5 0%, #2e4a6f 100%)' }
  }
}

function formatDate(iso: string, showDate: boolean): string {
  if (!showDate) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatTimeFromSec(sec: number): string {
  return new Date(sec * 1000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace(/^#/, '').match(/.{2}/g)
  if (!m) return [0, 0, 0]
  return m.map((x) => parseInt(x, 16)) as [number, number, number]
}

function SunriseIcon() {
  return (
    <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  )
}

function SunsetIcon() {
  return (
    <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 8v4M12 20v2M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="14" r="4" />
      <path d="M12 18v2M2 12h2M20 12h2" />
    </svg>
  )
}

export function Render() {
  const [, uiScale] = useUiScaleStoreState()
  useUiScaleToSetRem(uiScale)

  const [isLoadingMode, locationMode] = useLocationModeState()
  const [isLoadingCities, cities] = useCitiesState()
  const [, cycleDuration] = useCycleDurationState()
  const [, transitionStyle] = useTransitionStyleState()
  const [isLoadingUnits, temperatureUnits] = useTemperatureUnitsState()
  const [isLoadingForecast, forecastRange] = useForecastRangeState()
  const [, showDate] = useShowDateState()
  const [isLoadingBg, backgroundType] = useBackgroundTypeState()
  const [, solidColor] = useSolidColorState()
  const [, gradientColor1] = useGradientColor1State()
  const [, gradientColor2] = useGradientColor2State()
  const [, gradientDirection] = useGradientDirectionState()
  const [, backgroundImageId] = useBackgroundImageIdState()
  const [, backgroundVideoId] = useBackgroundVideoIdState()
  const [, overlayColor] = useOverlayColorState()
  const [, overlayOpacity] = useOverlayOpacityState()

  const shape = useLayoutShape()

  const unitSymbol = '°'
  const unitLabel = temperatureUnits === 'fahrenheit' ? '°F' : '°C'

  const effectiveCities = useMemo(() => {
    if (locationMode === 'automatic') return [{ cityName: '', displayName: 'Current location' }]
    return cities.filter((c) => c.cityName.trim() !== '')
  }, [locationMode, cities])

  const [cityIndex, setCityIndex] = useState(0)
  const currentCity = effectiveCities[cityIndex % Math.max(1, effectiveCities.length)] ?? effectiveCities[0]

  useEffect(() => {
    if (effectiveCities.length <= 1) return
    const id = setInterval(() => {
      setCityIndex((i) => i + 1)
    }, cycleDuration * 1000)
    return () => clearInterval(id)
  }, [effectiveCities.length, cycleDuration])

  const [isLoadingCache, weatherCache] = useWeatherCacheState()
  const [fallbackEntry, setFallbackEntry] = useState<WeatherCacheEntry | null>(null)
  const [fallbackLoading, setFallbackLoading] = useState(false)
  const fallbackForCityRef = useRef<string | null>(null)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)
  const [bgVideoUrl, setBgVideoUrl] = useState<string | null>(null)

  const cityQuery = useMemo(() => {
    if (locationMode === 'automatic') return null
    const name = currentCity?.cityName?.trim()
    return name || null
  }, [locationMode, currentCity])

  const cacheEntry = cityQuery ? weatherCache[cityQuery] : null
  const fallbackMatchesCity = cityQuery && fallbackEntry && fallbackForCityRef.current === cityQuery
  const dataEntry = cacheEntry ?? (fallbackMatchesCity ? fallbackEntry : null)

  const [displayCity, setDisplayCity] = useState<string | null>(null)
  const [displayData, setDisplayData] = useState<WeatherCacheEntry | null>(null)

  useEffect(() => {
    if (cityQuery && dataEntry) {
      setDisplayCity(cityQuery)
      setDisplayData(dataEntry)
    }
  }, [cityQuery, dataEntry])

  const apiKey = getOpenWeatherApiKey()
  useEffect(() => {
    if (!cityQuery || !apiKey?.trim() || cacheEntry) {
      setFallbackEntry(null)
      fallbackForCityRef.current = null
      return
    }
    fallbackForCityRef.current = null
    setFallbackEntry(null)
    let cancelled = false
    setFallbackLoading(true)
    fetchOpenWeather(apiKey, cityQuery)
      .then((entry) => {
        if (!cancelled && entry) {
          fallbackForCityRef.current = cityQuery
          setFallbackEntry(entry)
        }
      })
      .catch(() => {
        if (!cancelled) setFallbackEntry(null)
      })
      .finally(() => {
        if (!cancelled) setFallbackLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cityQuery, cacheEntry, apiKey])

  const conditions: WeatherCacheConditions | null = displayData?.conditions ?? null
  const rawForecast = displayData?.forecast ?? []
  const forecastRows: WeatherCacheForecastRow[] = useMemo(() => {
    if (rawForecast.length === 0) return []
    if (forecastRange === '24-hour') return rawForecast.slice(0, 8)
    if (forecastRange === '3-day') return [rawForecast[0], rawForecast[8], rawForecast[16]].filter(Boolean)
    if (forecastRange === '7-day') return [rawForecast[0], rawForecast[8], rawForecast[16], rawForecast[24], rawForecast[32]].filter(Boolean)
    return rawForecast.slice(0, 8)
  }, [rawForecast, forecastRange])
  const loading = Boolean(cityQuery && !displayData && (isLoadingCache || fallbackLoading))

  useEffect(() => {
    if (backgroundType !== 'image' || !backgroundImageId) {
      setBgImageUrl(null)
      return
    }
    let cancelled = false
    media()
      .getById(backgroundImageId)
      .then((item) => {
        if (!cancelled && item?.publicUrls?.length) setBgImageUrl(item.publicUrls[0])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [backgroundType, backgroundImageId])

  useEffect(() => {
    if (backgroundType !== 'video' || !backgroundVideoId) {
      setBgVideoUrl(null)
      return
    }
    let cancelled = false
    media()
      .getById(backgroundVideoId)
      .then((item) => {
        if (!cancelled && item?.publicUrls?.length) setBgVideoUrl(item.publicUrls[0])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [backgroundType, backgroundVideoId])

  const configLoading = isLoadingMode || isLoadingCities || isLoadingUnits || isLoadingForecast || isLoadingBg
  const hasNoCity = locationMode === 'manual' && effectiveCities.length === 0
  const hasError = !configLoading && !loading && !displayData && !hasNoCity && cityQuery !== null
  const automaticNoData = locationMode === 'automatic'

  if (configLoading) return null
  if (hasNoCity || hasError || automaticNoData) return <div className="render render--transparent" aria-hidden />

  const showP2Content = showP2(shape)
  const showP3Content = showP3(shape)
  const displayCityEntry = effectiveCities.find((c) => c.cityName.trim() === displayCity)
  const locationLabel = displayCityEntry?.displayName?.trim() || displayCityEntry?.cityName?.trim() || displayCity || '—'

  const temp = conditions
    ? temperatureUnits === 'fahrenheit'
      ? conditions.temperatureF
      : conditions.temperatureC
    : 0
  const iconCategory = conditions ? getWeatherIconCategory(conditions.weatherCode) : 'sun'

  let backgroundStyle: React.CSSProperties = {}
  if (backgroundType === 'default' && conditions) {
    const { bg } = getBackgroundFromWeather(iconCategory)
    backgroundStyle = { background: bg }
  } else if (backgroundType === 'solid') {
    backgroundStyle = { backgroundColor: solidColor }
  } else if (backgroundType === 'gradient') {
    const dir =
      gradientDirection === 'top-to-bottom'
        ? '180deg'
        : gradientDirection === 'bottom-to-top'
          ? '0deg'
          : gradientDirection === 'left-to-right'
            ? '90deg'
            : '270deg'
    backgroundStyle = {
      background: `linear-gradient(${dir}, ${gradientColor1}, ${gradientColor2})`,
    }
  } else if (backgroundType === 'default') {
    backgroundStyle = { background: 'hsl(220 15% 8%)' }
  }

  const overlayStyle =
    (backgroundType === 'image' && bgImageUrl) || (backgroundType === 'video' && bgVideoUrl)
      ? {
          backgroundColor: `rgba(${hexToRgb(overlayColor).join(',')}, ${overlayOpacity / 100})`,
        }
      : undefined

  return (
    <div
      className={`render weather weather--${shape}`}
      style={backgroundStyle}
      data-transition={transitionStyle}
    >
      {backgroundType === 'image' && bgImageUrl && (
        <div className="weather__bg-image" style={{ backgroundImage: `url(${bgImageUrl})` }} />
      )}
      {backgroundType === 'video' && bgVideoUrl && (
        <div className="weather__bg-video">
          <video src={bgVideoUrl} autoPlay loop muted playsInline aria-hidden />
        </div>
      )}
      {(backgroundType === 'image' && bgImageUrl) || (backgroundType === 'video' && bgVideoUrl) ? (
        <div className="weather__overlay" style={overlayStyle} aria-hidden />
      ) : null}

      <div className="weather__left">
        {loading ? (
          <WeatherSkeleton shape={shape} />
        ) : (
          <div key={displayCity ?? ''} className="weather__content-transition">
            <header className="weather__top">
              <div className="weather__top-pill">
                <span className="weather__location-pill">{locationLabel || '—'}</span>
                <time className="weather__datetime-badge" dateTime={new Date().toISOString()}>
                  {showDate ? (
                    <>
                      <span className="weather__datetime-today">Today</span>
                      <span className="weather__datetime-sep" aria-hidden />
                      <span className="weather__datetime-time">{formatTime(new Date().toISOString())}</span>
                    </>
                  ) : (
                    formatTime(new Date().toISOString())
                  )}
                </time>
              </div>
            </header>

            <div className="weather__main">
              <section className="weather__current">
                <div className="weather__current-head">
                  <span className="weather__icon weather__icon--current" aria-hidden>
                    <WeatherIconSvg category={iconCategory} sizeRem={20} />
                  </span>
                  <span className="weather__temp" aria-label={`Temperature ${Math.round(temp)} ${unitLabel}`}>
                    {Math.round(temp)}{unitSymbol}
                  </span>
                </div>
                {(showP2Content && conditions) || conditions?.sunriseSec != null || conditions?.sunsetSec != null ? (
                  <div className="weather__conditions-row">
                    {showP2Content && conditions && (
                      <span className="weather__conditions">{conditions.weatherDescription}</span>
                    )}
                    {conditions?.sunriseSec != null && (
                      <span className="weather__sun-item">
                        <SunriseIcon />
                        {formatTimeFromSec(conditions.sunriseSec)}
                      </span>
                    )}
                    {conditions?.sunsetSec != null && (
                      <span className="weather__sun-item">
                        <SunsetIcon />
                        {formatTimeFromSec(conditions.sunsetSec)}
                      </span>
                    )}
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        )}
      </div>

      <div className="weather__right-panel">
        {!loading && showP3Content && forecastRows.length > 0 && (
          <aside key={displayCity ?? ''} className="weather__hourly weather__content-transition">
            {forecastRows.slice(0, 6).map((row, i) => {
              const displayTemp = temperatureUnits === 'fahrenheit' ? (row.temp * 9) / 5 + 32 : row.temp
              const rowCategory = row.weatherCode != null ? getWeatherIconCategory(row.weatherCode) : iconCategory
              return (
                <div key={i} className="weather__hourly-item">
                  <span className="weather__hourly-time">{row.label}</span>
                  <span className="weather__hourly-icon" aria-hidden>
                    <WeatherIconSvg category={rowCategory} sizeRem={5} />
                  </span>
                  <span className="weather__hourly-temp">{Math.round(displayTemp)}{unitSymbol}</span>
                </div>
              )
            })}
          </aside>
        )}
      </div>
    </div>
  )
}

function WeatherSkeleton(_props?: { shape?: LayoutShape }) {
  return (
    <>
      <header className="weather__top weather__skeleton">
        <div className="weather__top-pill">
          <span className="weather__location-pill weather__temp-skel" />
          <span className="weather__datetime-badge weather__date-skel" />
        </div>
      </header>
      <div className="weather__main">
        <section className="weather__current weather__skeleton">
          <div className="weather__current-head">
            <span className="weather__icon-skel" />
            <span className="weather__temp-skel" />
          </div>
          <div className="weather__conditions-row">
            <span className="weather__conditions-skel" />
          </div>
        </section>
      </div>
    </>
  )
}
