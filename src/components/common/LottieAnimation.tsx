import { useRef, useEffect } from 'react'
import lottie from 'lottie-web'

interface Props {
  animationData: object
  size?: number
}

export default function LottieAnimation({ animationData, size = 24 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: 'svg',
      autoplay: true,
      loop: true,
      animationData,
    })
    return () => anim.destroy()
  }, [animationData])

  return <div ref={ref} style={{ width: size, height: size }} />
}
