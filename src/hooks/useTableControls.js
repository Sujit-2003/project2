import { useState, useMemo } from 'react'

const PAGE_SIZE = 10

export default function useTableControls(data, filterKeys = []) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data
    const term = searchTerm.toLowerCase()
    return data.filter((item) =>
      filterKeys.some((key) => {
        const val = item[key]
        return val && String(val).toLowerCase().includes(term)
      }),
    )
  }, [data, searchTerm, filterKeys])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredData.slice(start, start + PAGE_SIZE)
  }, [filteredData, currentPage])

  // Reset to page 1 when search changes
  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  return {
    paginatedData,
    currentPage,
    totalPages,
    searchTerm,
    setCurrentPage,
    setSearchTerm: handleSearch,
    totalItems: filteredData.length,
  }
}
