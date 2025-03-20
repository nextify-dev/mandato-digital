// src/utils/functions/databaseUtils.ts

import { db } from '@/lib/firebase'
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

// Interface genérica para dados do Realtime Database
interface DatabaseItem {
  id: string
  [key: string]: any
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
