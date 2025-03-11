// src/utils/functions/convertTimestamp.ts

const monthNames = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
]

// ==> SAÍDA: DD/MM/AAAA às HH/MM
const timestampToDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const dateString = `${day}/${month}/${year} às ${hours}:${minutes}`

  return dateString
}

// ==> SAÍDA: HH/MM
const timestampToHours = (timestamp: string): string => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// ==> SAÍDA: DD de MM de AAAA
const timestampToCreationDay = (timestamp: string): string => {
  const date = new Date(timestamp)

  const day = String(date.getDate()).padStart(2, '0')
  const month = monthNames[date.getMonth()]
  const year = String(date.getFullYear())

  return `${day} de ${month} de ${year}`
}

export { timestampToCreationDay, timestampToDate, timestampToHours }
