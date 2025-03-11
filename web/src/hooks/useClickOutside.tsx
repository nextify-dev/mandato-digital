import { useCallback, useEffect } from 'react'

type ClickOutsideProps = {
  active: boolean
  containerRef: React.RefObject<HTMLElement>
  onClickOutside: () => void
}

function useClickOutside({
  active,
  containerRef,
  onClickOutside
}: ClickOutsideProps) {
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        active &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClickOutside()
      }
    },
    [active, containerRef, onClickOutside]
  )

  useEffect(() => {
    if (active) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [active, containerRef, handleClickOutside, onClickOutside])
}

export default useClickOutside
