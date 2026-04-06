import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { fetchMe } from './features/auth/authSlice'
import AppRoutes from './routes/AppRoutes'

const App = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchMe())
  }, [dispatch])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
