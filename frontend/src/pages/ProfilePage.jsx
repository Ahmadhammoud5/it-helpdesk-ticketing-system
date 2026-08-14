import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'

import {
  changePassword,
  deleteProfilePhoto,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
} from '../api/profileApi'
import { useAuth } from '../auth/useAuth'
import { getRoleContext } from '../auth/roles'
import UserAvatar from '../components/profile/UserAvatar'

const photoAccept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
const maxPhotoSize = 2 * 1024 * 1024

function getErrorMessage(error, fallback) {
  const response = error.response?.data

  if (Array.isArray(response?.errors)) {
    const descriptions = response.errors
      .map((item) => item.description)
      .filter(Boolean)

    if (descriptions.length > 0) {
      return descriptions.join(' ')
    }
  }

  if (response?.errors && typeof response.errors === 'object') {
    const validationMessages = Object.values(response.errors)
      .flat()
      .filter(Boolean)

    if (validationMessages.length > 0) {
      return validationMessages.join(' ')
    }
  }

  return response?.message ?? fallback
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Not available'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function ProfilePage() {
  const navigate = useNavigate()
  const {
    user,
    signOut,
    updateCurrentUser,
  } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [removingPhoto, setRemovingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState('')
  const [photoInputKey, setPhotoInputKey] = useState(0)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    let active = true

    getProfile()
      .then((profileData) => {
        if (!active) {
          return
        }

        setProfile(profileData)
        setProfileForm({
          firstName: profileData.firstName ?? '',
          lastName: profileData.lastName ?? '',
          phoneNumber: profileData.phoneNumber ?? '',
        })
        updateCurrentUser({
          fullName: profileData.fullName,
          email: profileData.email,
          roles: profileData.roles ?? [],
          hasProfilePhoto:
            profileData.hasProfilePhoto === true,
        })
      })
      .catch((requestError) => {
        if (active) {
          setLoadError(getErrorMessage(
            requestError,
            'Unable to load your profile.',
          ))
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [updateCurrentUser])

  function syncProfile(profileData, photoChanged = false) {
    setProfile(profileData)
    updateCurrentUser({
      fullName: profileData.fullName,
      email: profileData.email,
      roles: profileData.roles ?? [],
      hasProfilePhoto:
        profileData.hasProfilePhoto === true,
      ...(photoChanged
        ? { avatarVersion: Date.now() }
        : {}),
    })
  }

  function handleProfileChange(event) {
    const { name, value } = event.target
    setProfileError('')
    setProfileSuccess('')
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setProfileError('')
    setProfileSuccess('')

    const firstName = profileForm.firstName.trim()
    const lastName = profileForm.lastName.trim()
    const phoneNumber = profileForm.phoneNumber.trim()

    if (!firstName || !lastName) {
      setProfileError('First name and last name are required.')
      return
    }

    if (
      phoneNumber &&
      !/^[0-9+().\-\s]+$/.test(phoneNumber)
    ) {
      setProfileError(
        'Phone number contains unsupported characters.',
      )
      return
    }

    setSavingProfile(true)

    try {
      const profileData = await updateProfile({
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
      })

      syncProfile(profileData)
      setProfileForm({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber ?? '',
      })
      setProfileSuccess('Your profile was updated successfully.')
    } catch (requestError) {
      setProfileError(getErrorMessage(
        requestError,
        'Unable to update your profile.',
      ))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePhotoSelection(event) {
    const photo = event.target.files?.[0]

    setPhotoError('')
    setPhotoSuccess('')

    if (!photo) {
      return
    }

    const validTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ])

    if (!validTypes.has(photo.type)) {
      setPhotoError('Please select a JPG, PNG, or WEBP image.')
      setPhotoInputKey((current) => current + 1)
      return
    }

    if (photo.size <= 0 || photo.size > maxPhotoSize) {
      setPhotoError('Profile photos must be between 1 byte and 2 MB.')
      setPhotoInputKey((current) => current + 1)
      return
    }

    setUploadingPhoto(true)

    try {
      const profileData = await uploadProfilePhoto(photo)
      syncProfile(profileData, true)
      setPhotoSuccess('Your profile photo was updated.')
    } catch (requestError) {
      setPhotoError(getErrorMessage(
        requestError,
        'Unable to upload your profile photo.',
      ))
    } finally {
      setUploadingPhoto(false)
      setPhotoInputKey((current) => current + 1)
    }
  }

  async function handleRemovePhoto() {
    if (!window.confirm('Remove your profile photo?')) {
      return
    }

    setPhotoError('')
    setPhotoSuccess('')
    setRemovingPhoto(true)

    try {
      await deleteProfilePhoto()

      const profileData = {
        ...profile,
        hasProfilePhoto: false,
      }

      syncProfile(profileData, true)
      setPhotoSuccess('Your profile photo was removed.')
    } catch (requestError) {
      setPhotoError(getErrorMessage(
        requestError,
        'Unable to remove your profile photo.',
      ))
    } finally {
      setRemovingPhoto(false)
    }
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target
    setPasswordError('')
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordError('')

    if (
      passwordForm.newPassword !==
      passwordForm.confirmNewPassword
    ) {
      setPasswordError(
        'The new password and confirmation do not match.',
      )
      return
    }

    setChangingPassword(true)

    try {
      await changePassword(passwordForm)
      signOut()
      navigate('/login', {
        replace: true,
        state: {
          sessionMessage:
            'Your password was changed successfully. Sign in again with your new password.',
        },
      })
    } catch (requestError) {
      setPasswordError(getErrorMessage(
        requestError,
        'Unable to change your password.',
      ))
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-[50vh] items-center justify-center text-blue-600"
      >
        <LoaderCircle size={28} className="animate-spin" />
        <span className="sr-only">Loading profile</span>
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto text-red-600" size={28} />
        <h1 className="mt-3 text-xl font-bold text-red-900">
          Unable to load profile
        </h1>
        <p className="mt-2 text-sm text-red-700">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </section>
    )
  }

  const roleContext = getRoleContext({
    roles: profile.roles,
  })
  const busyPhoto = uploadingPhoto || removingPhoto

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">
          Account settings
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage your personal account information and security.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar user={user} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-slate-900">
                {profile.fullName}
              </h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {roleContext.role}
              </span>
              <span className={[
                'rounded-full px-3 py-1 text-xs font-bold',
                profile.isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700',
              ].join(' ')}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {profile.email}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 has-disabled:cursor-not-allowed has-disabled:bg-blue-400">
                {uploadingPhoto ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                {uploadingPhoto ? 'Uploading...' : 'Upload new photo'}
                <input
                  key={photoInputKey}
                  type="file"
                  accept={photoAccept}
                  onChange={handlePhotoSelection}
                  disabled={busyPhoto}
                  className="sr-only"
                />
              </label>

              {profile.hasProfilePhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={busyPhoto}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removingPhoto ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {removingPhoto ? 'Removing...' : 'Remove photo'}
                </button>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              JPG, PNG or WEBP. Maximum file size 2 MB.
            </p>
            {photoError && (
              <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
                {photoError}
              </p>
            )}
            {photoSuccess && (
              <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">
                {photoSuccess}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <UserRound size={20} className="text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Personal information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the personal details shown across HelpDesk.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="First name" htmlFor="firstName">
                <input
                  id="firstName"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  maxLength={50}
                  required
                  disabled={savingProfile}
                  className="profile-input"
                />
              </FormField>
              <FormField label="Last name" htmlFor="lastName">
                <input
                  id="lastName"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  maxLength={50}
                  required
                  disabled={savingProfile}
                  className="profile-input"
                />
              </FormField>
            </div>

            <FormField label="Email address" htmlFor="profileEmail">
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="profileEmail" value={profile.email} readOnly className="profile-input bg-slate-50 pl-11 text-slate-500" />
              </div>
            </FormField>

            <FormField label="Phone number (optional)" htmlFor="phoneNumber">
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={profileForm.phoneNumber}
                onChange={handleProfileChange}
                maxLength={30}
                disabled={savingProfile}
                placeholder="e.g. +961 1 234 567"
                className="profile-input"
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <ReadOnlyField label="Department" value={profile.departmentName ?? 'Not assigned'} />
              <ReadOnlyField label="Role" value={(profile.roles ?? []).join(', ') || 'Not assigned'} />
              <ReadOnlyField label="Account status" value={profile.isActive ? 'Active' : 'Inactive'} />
              <ReadOnlyField label="Member since" value={formatDate(profile.createdDate)} icon={CalendarDays} />
            </div>

            {profileError && <Message type="error">{profileError}</Message>}
            {profileSuccess && <Message type="success">{profileSuccess}</Message>}

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {savingProfile && <LoaderCircle size={16} className="animate-spin" />}
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="self-start rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Security</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Change your password and sign in again securely.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5 p-5 sm:p-6">
            <PasswordField
              id="currentPassword"
              label="Current password"
              value={passwordForm.currentPassword}
              visible={showPasswords.currentPassword}
              disabled={changingPassword}
              autoComplete="current-password"
              onChange={handlePasswordChange}
              onToggle={() => setShowPasswords((current) => ({
                ...current,
                currentPassword: !current.currentPassword,
              }))}
            />
            <PasswordField
              id="newPassword"
              label="New password"
              value={passwordForm.newPassword}
              visible={showPasswords.newPassword}
              disabled={changingPassword}
              autoComplete="new-password"
              onChange={handlePasswordChange}
              onToggle={() => setShowPasswords((current) => ({
                ...current,
                newPassword: !current.newPassword,
              }))}
            />
            <PasswordField
              id="confirmNewPassword"
              label="Confirm new password"
              value={passwordForm.confirmNewPassword}
              visible={showPasswords.confirmNewPassword}
              disabled={changingPassword}
              autoComplete="new-password"
              onChange={handlePasswordChange}
              onToggle={() => setShowPasswords((current) => ({
                ...current,
                confirmNewPassword: !current.confirmNewPassword,
              }))}
            />

            <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              Use at least 8 characters with uppercase, lowercase, number and symbol characters.
            </p>

            {passwordError && <Message type="error">{passwordError}</Message>}

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {changingPassword ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <LockKeyhole size={16} />
              )}
              {changingPassword ? 'Changing password...' : 'Change password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

function FormField({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  )
}

function ReadOnlyField({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
        {Icon && <Icon size={16} className="text-slate-400" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  visible,
  disabled,
  autoComplete,
  onChange,
  onToggle,
}) {
  return (
    <FormField label={label} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          className="profile-input pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </FormField>
  )
}

function Message({ type, children }) {
  const success = type === 'success'

  return (
    <div
      role={success ? 'status' : 'alert'}
      className={[
        'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold',
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700',
      ].join(' ')}
    >
      {success ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
      <span>{children}</span>
    </div>
  )
}

export default ProfilePage
