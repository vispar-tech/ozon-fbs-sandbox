import type { JSX } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from './AppShell.js'
import { ErrorBoundary } from './ErrorBoundary.js'

import { AdminDashboard } from '@/pages/admin/index.js'
import { ErrorPage } from '@/pages/error/index.js'
import { SellerDetails } from '@/pages/seller/index.js'
import { Showcase } from '@/pages/showcase/index.js'
import { ToastProvider } from '@/shared/ui/feedback/index.js'

function App (): JSX.Element {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path='/' element={<AdminDashboard />} />
              <Route path='/seller/:id' element={<SellerDetails />} />
            </Route>
            <Route path='/design-code' element={<Showcase />} />
            <Route path='*' element={<ErrorPage variant='not-found' />} />
          </Routes>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
