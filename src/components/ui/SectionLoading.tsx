import { Loader2 } from 'lucide-react'

const skeletonClass = 'animate-pulse bg-gray-200 rounded'

type Variant = 'card' | 'list' | 'calendar' | 'notice' | 'room-card' | 'minimal'

type Props = {
  variant?: Variant
  className?: string
}

export default function SectionLoading({ variant = 'card', className = '' }: Props) {
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="w-6 h-6 text-[#3072E1] animate-spin" aria-hidden />
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`h-5 w-32 ${skeletonClass}`} />
          <div className={`h-6 w-16 ${skeletonClass}`} />
        </div>
        <div className={`h-4 w-full max-w-[200px] ${skeletonClass} mb-3`} />
        <div className="flex gap-2 mb-3">
          <div className={`h-6 w-14 ${skeletonClass}`} />
          <div className={`h-6 w-14 ${skeletonClass}`} />
        </div>
        <div className="flex gap-2">
          <div className={`h-9 flex-1 ${skeletonClass}`} />
          <div className={`h-9 flex-1 ${skeletonClass}`} />
        </div>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
            <div className={`h-10 w-10 rounded-full ${skeletonClass} shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-[75%] ${skeletonClass}`} />
              <div className={`h-3 w-1/2 ${skeletonClass}`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'notice') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-full max-w-[240px] ${skeletonClass}`} />
              <div className={`h-3 w-20 ${skeletonClass}`} />
            </div>
            <div className={`h-5 w-5 ${skeletonClass} shrink-0 ml-2`} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'room-card') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className={`h-5 w-28 ${skeletonClass}`} />
              <div className={`h-5 w-16 ${skeletonClass}`} />
            </div>
            <div className={`h-3 w-full max-w-[180px] ${skeletonClass} mb-3`} />
            <div className="flex flex-wrap gap-2 mb-3">
              <div className={`h-6 w-14 ${skeletonClass}`} />
              <div className={`h-6 w-14 ${skeletonClass}`} />
            </div>
            <div className={`h-9 w-full rounded-lg ${skeletonClass}`} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'calendar') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-b-0">
            <div className={`h-10 w-12 ${skeletonClass} shrink-0`} />
            <div className={`h-4 flex-1 max-w-[200px] ${skeletonClass}`} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <Loader2 className="w-6 h-6 text-[#3072E1] animate-spin" aria-hidden />
    </div>
  )
}
