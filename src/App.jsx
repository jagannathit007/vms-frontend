import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Navigate, } from 'react-router-dom';
import { LoginPage , AdminPanelPage, CompanyLoginPage, CompanyPanelPage } from './pages';
import {CompanyPrivateRoute, PrivateRoute} from './components/PrivateRoute';
import VisitorForm from './components/VisitorForm';

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path='/admin/login' element={<LoginPage/>} />
          <Route path='/super-admin' element={<PrivateRoute><AdminPanelPage/></PrivateRoute>} />

          <Route path='/' element={<CompanyLoginPage/>}/>
          <Route path='/company' element={<CompanyPrivateRoute><CompanyPanelPage/></CompanyPrivateRoute>}/>

          <Route path="/visitor-form/:companyId" element={<VisitorForm />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
