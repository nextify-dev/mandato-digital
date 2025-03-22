const formatUsername = (
  fullName?: string
): {
  reducedName: string
  initials: string
  lastName: string
  firstName: string
} => {
  const nameParts = fullName?.trim().split(/\s+/) || []

  if (nameParts.length < 2) {
    throw new Error(
      'O nome deve conter pelo menos duas partes (ex: "Henrique Garcia").'
    )
  }

  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]
  const middleLastName =
    nameParts.length > 2 ? nameParts[nameParts.length - 2] : lastName
  const reducedName = `${firstName} ${middleLastName.charAt(0).toUpperCase()}.`
  const initials = `${firstName.charAt(0).toUpperCase()}${middleLastName
    .charAt(0)
    .toUpperCase()}`

  return {
    reducedName,
    initials,
    lastName,
    firstName
  }
}

export default formatUsername
