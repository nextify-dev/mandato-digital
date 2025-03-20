// src/utils/functions/firebaseUtils.ts

import { db, storage } from '@/lib/firebase'
import {
  ref as dbRef,
  get,
  set,
  remove,
  query,
  orderByChild,
  startAt,
  endAt,
  onValue,
  off,
  DatabaseReference
} from 'firebase/database'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference
} from 'firebase/storage'
import { RcFile, UploadFile } from 'antd/lib/upload/interface'
import { getAuth } from 'firebase/auth'

// Interface genérica para dados do Realtime Database
interface DatabaseItem {
  id: string
  [key: string]: any
}

const generateUniqueCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

// Função para buscar dados do Realtime Database
export const fetchFromDatabase = async <T extends DatabaseItem>(
  path: string,
  filters?: { key: string; value: string | number | boolean },
  singleItem: boolean = false
): Promise<T[] | T> => {
  try {
    const dbReference = dbRef(db, path)
    let q: DatabaseReference = dbReference

    if (filters && !singleItem) {
      q = query(
        dbReference,
        orderByChild(filters.key),
        startAt(filters.value),
        endAt(filters.value + '\uf8ff')
      ) as DatabaseReference
    }

    const snapshot = await get(q)
    if (!snapshot.exists()) {
      if (singleItem) {
        throw new Error(`Nenhum item encontrado no caminho ${path}`)
      }
      return []
    }

    const data = snapshot.val()
    if (!data || typeof data !== 'object') {
      if (singleItem) {
        throw new Error(
          `Dados no caminho ${path} não são um objeto válido: ${JSON.stringify(
            data
          )}`
        )
      }
      return []
    }

    if (singleItem) {
      return { id: path.split('/').pop() || '', ...data } as T
    }

    const items: T[] = Object.entries(data).map(([id, item]) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(
          `Item com ID ${id} não é um objeto válido: ${JSON.stringify(item)}`
        )
      }
      return { id, ...item } as T
    })

    return items
  } catch (error) {
    console.error(
      `Erro ao buscar dados do Realtime Database em ${path}:`,
      error
    )
    throw new Error(
      `Falha ao buscar dados: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

// Função para ouvir mudanças em tempo real no Realtime Database
export const listenToDatabase = <T extends DatabaseItem>(
  path: string,
  callback: (data: T[]) => void,
  errorCallback?: (error: Error) => void,
  filters?: { key: string; value: string }
): (() => void) => {
  const dbReference = dbRef(db, path)
  let q: DatabaseReference = dbReference

  if (filters) {
    q = query(
      dbReference,
      orderByChild(filters.key),
      startAt(filters.value),
      endAt(filters.value + '\uf8ff')
    ) as DatabaseReference
  }

  const listener = (snapshot: any) => {
    const data = snapshot.val() || {}
    const items = Object.entries(data).map(([id, item]) => ({
      id,
      ...(typeof item === 'object' && item !== null ? item : {})
    })) as T[]
    callback(items)
  }

  onValue(
    q,
    listener,
    errorCallback ? (error) => errorCallback(error) : undefined
  )

  return () => off(q, 'value', listener)
}

// Função para criar ou atualizar um item no Realtime Database
export const saveToDatabase = async <T extends DatabaseItem>(
  path: string,
  data: T
): Promise<void> => {
  if (typeof data !== 'object' || data === null || !data.id) {
    throw new Error(
      `Dados inválidos para salvar no caminho ${path}: ${JSON.stringify(data)}`
    )
  }
  const dbReference = dbRef(db, `${path}/${data.id}`)
  await set(dbReference, data)
}

// Função para deletar um item do Realtime Database
export const deleteFromDatabase = async (path: string): Promise<void> => {
  const dbReference = dbRef(db, path)
  await remove(dbReference)
}

// Função para fazer upload de arquivos para o Storage
export const uploadFilesToStorage = async (
  path: string,
  files: RcFile[]
): Promise<string[]> => {
  if (!files || files.length === 0) return []

  const uploadPromises = files.map(async (file) => {
    if (!(file instanceof File)) {
      throw new Error(`Arquivo inválido: ${file}`)
    }

    // Gera um código único de 5 dígitos
    const uniqueCode = generateUniqueCode()
    const fileName = file.name
    // Adiciona o código único como prefixo no nome do arquivo
    const storageFileName = `${uniqueCode}_${fileName}`
    const fileRef = storageRef(storage, `${path}/${storageFileName}`)

    // Garante que o tipo MIME seja preservado
    const metadata = {
      contentType: file.type || 'application/octet-stream'
    }

    const uploadResult = await uploadBytes(fileRef, file, metadata)
    return getDownloadURL(uploadResult.ref)
  })

  try {
    return await Promise.all(uploadPromises)
  } catch (error) {
    // Tenta limpar os arquivos em caso de falha
    await deleteFilesFromStorage(path).catch((cleanupError) =>
      console.warn(
        'Erro ao limpar arquivos após falha de upload:',
        cleanupError
      )
    )
    throw new Error(`Falha ao carregar arquivos no Storage: ${error}`)
  }
}

// Função para deletar arquivos do Storage
export const deleteFilesFromStorage = async (path: string): Promise<void> => {
  const folderRef = storageRef(storage, path)
  const listResult = await listAll(folderRef)
  if (listResult.items.length === 0) return

  const deletePromises = listResult.items.map(
    async (itemRef: StorageReference) => {
      try {
        await deleteObject(itemRef)
      } catch (err) {
        throw new Error(`Erro ao deletar ${itemRef.fullPath}: ${err}`)
      }
    }
  )

  await Promise.all(deletePromises)
}

// Função ajustada para criar um RcFile mockado sem baixar o arquivo
export const urlToRcFile = async (
  url: string,
  fileName: string
): Promise<RcFile> => {
  // Remove o prefixo de 5 dígitos seguido de underscore, se existir
  const cleanFileName = fileName.replace(/^[A-Z0-9]{5}_/, '')

  const extension = cleanFileName.split('.').pop()?.toLowerCase() || ''
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov']
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt']
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv']

  let mimeType = 'application/octet-stream'
  if (imageExtensions.includes(extension)) {
    mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`
  } else if (videoExtensions.includes(extension)) {
    mimeType = `video/${extension}`
  } else if (documentExtensions.includes(extension)) {
    mimeType =
      extension === 'pdf' ? 'application/pdf' : 'application/octet-stream'
  } else if (spreadsheetExtensions.includes(extension)) {
    mimeType = 'application/vnd.ms-excel'
  }

  const file = new File([], cleanFileName, { type: mimeType }) as RcFile
  file.uid = `rc-upload-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`
  return file
}

// Função para extrair informações de um arquivo a partir de uma URL
export const extractFileInfoFromUrl = (
  url: string,
  index: number
): UploadFile => {
  const cleanUrl = url.split('?')[0]
  const segments = cleanUrl.split('/')
  let lastSegment = segments.pop() || ''
  const pathSegments = lastSegment.split('%2F')
  let fileNameEncoded = pathSegments.pop() || `Documento ${index + 1}`
  const fileName = decodeURIComponent(fileNameEncoded)
  // Remove o prefixo de 5 dígitos seguido de underscore, se existir
  const cleanFileName = fileName.replace(/^[A-Z0-9]{5}_/, '')

  const extensionMatch = cleanFileName.match(/\.([^.]+)$/) || []
  const extension = extensionMatch[1]?.toLowerCase() || 'desconhecido'
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov']
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt']
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv']
  let type: string

  if (imageExtensions.includes(extension)) {
    type = 'image'
  } else if (videoExtensions.includes(extension)) {
    type = 'video'
  } else if (documentExtensions.includes(extension)) {
    type = 'document'
  } else if (spreadsheetExtensions.includes(extension)) {
    type = 'spreadsheet'
  } else {
    type = 'other'
  }

  return {
    uid: `${index}`,
    name: cleanFileName, // Usa o nome sem o prefixo
    status: 'done',
    url,
    type
  }
}

export const getTypeLabel = (type?: string): string => {
  switch (type) {
    case 'image':
      return 'Imagem'
    case 'video':
      return 'Vídeo'
    case 'document':
      return 'Documento'
    case 'spreadsheet':
      return 'Tabela'
    default:
      return 'Outro'
  }
}
