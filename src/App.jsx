import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Navigate, } from 'react-router-dom';
import { LoginPage , AdminPanelPage, CompanyLoginPage, CompanyPanelPage } from './pages';
import {CompanyPrivateRoute, PrivateRoute} from './components/PrivateRoute';
import VisitorForm from './components/VisitorForm';
import WatchmenLogin from './components/watchmen/watchmenLogin';
import WatchmenDashboard from './components/watchmen/WatchmenDashboard';

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path='/admin/login' element={<LoginPage/>} />
          <Route path='/super-admin' element={<PrivateRoute><AdminPanelPage/></PrivateRoute>} />

          <Route path='/:companyName' element={<CompanyLoginPage/>}/>
          <Route path='/company' element={<CompanyPrivateRoute><CompanyPanelPage/></CompanyPrivateRoute>}/>

          <Route path="/visitor-form/:companyId" element={<VisitorForm />} />

          <Route path="*" element={<CompanyLoginPage/>} />

          <Route path='/watchmen/login' element={<WatchmenLogin/>}/>
          <Route path='/watchmen' element={<WatchmenDashboard/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App
