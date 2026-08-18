import { useEffect, useState } from 'react'

import { getProfilePhoto } from '../../api/profileApi'

const sizeClasses = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-base',
  lg: 'h-24 w-24 text-2xl',
}

function getInitials(fullName) {
  if (!fullName?.trim()) {
    return 'U'
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function UserAvatar({
  user,
  size = 'sm',
  className = '',
}) {
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl = ''

    setPhotoFailed(false)

    if (!user?.hasProfilePhoto) {
      setPhotoUrl('')
      return () => {
        active = false
      }
    }

    getProfilePhoto()
      .then((photoBlob) => {
        if (!active) {
          return
        }

        objectUrl = window.URL.createObjectURL(photoBlob)
        setPhotoUrl(objectUrl)
      })
      .catch(() => {
        if (active) {
          setPhotoUrl('')
          setPhotoFailed(true)
        }
      })

    return () => {
      active = false

      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl)
      }
    }
  }, [user?.hasProfilePhoto, user?.avatarVersion])

  const sizeClass = sizeClasses[size] ?? sizeClasses.sm
  const label = user?.fullName
    ? `${user.fullName}'s profile photo`
    : 'User profile photo'

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 font-bold text-white shadow-sm',
        sizeClass,
        className,
      ].join(' ')}
    >
      {photoUrl && !photoFailed ? (
        <img
          src={photoUrl}
          alt={label}
          onError={() => setPhotoFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-label={label} role="img">
          {getInitials(user?.fullName)}
        </span>
      )}
    </span>
  )
}

export default UserAvatar
