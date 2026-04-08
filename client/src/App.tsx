import { createBrowserRouter, RouterProvider } from "react-router-dom"
import MainLayout from "./MainLayout"
import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import Feed from "./pages/Feed"
import Profile from "./pages/Profile"
import Connections from "./pages/Connections"
import Requests from "./pages/Requests"
import Chat from "./pages/Chat"

const Router = createBrowserRouter([{
  path:'/',
  element:<MainLayout/>,
  children:[
    {
      path:'/',
      element:<Feed/>
    },
    {
      path:'/login',
      element:<Login/>
    },
    {
      path:'signUp',
      element:<SignUp/>
    },
    {
      path:'profile',
      element:<Profile/>
    },
    {
      path:'connections',
      element:<Connections/>
    },
    {
      path:"requests",
      element:<Requests/>
    },
    {
      path:"chat/:toUserId",
      element:<Chat/>
    } 
  ]
}])

const App = () => {
  return (
   <RouterProvider router={Router}  />
  )
}

export default App