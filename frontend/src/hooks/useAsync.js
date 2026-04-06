import { useState, useCallback } from 'react'

export const useAsync = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const run = useCallback(async (promise) => {
    setLoading(true)
    setError(null)
    try {
      const result = await promise
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, data, run }
}
