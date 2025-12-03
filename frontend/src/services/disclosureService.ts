import api from './api'
import { Disclosure, DisclosureCreate, User } from '@/types'

export const disclosureService = {
  async getAll(): Promise<Disclosure[]> {
    const response = await api.get<Disclosure[]>('/disclosures/')
    return response.data
  },

  async getById(id: number): Promise<Disclosure> {
    const response = await api.get<Disclosure>(`/disclosures/${id}`)
    return response.data
  },

  async create(data: DisclosureCreate): Promise<Disclosure> {
    const response = await api.post<Disclosure>('/disclosures/', data)
    return response.data
  },

  async update(id: number, data: Partial<DisclosureCreate>): Promise<Disclosure> {
    const response = await api.patch<Disclosure>(`/disclosures/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/disclosures/${id}`)
  },

  async getLawyers(): Promise<User[]> {
    const response = await api.get<User[]>('/users/lawyers')
    return response.data
  },
}
