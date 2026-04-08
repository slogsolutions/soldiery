import { Outlet, useNavigate,  } from "react-router-dom";
import Footer from "./ui/footer/Footer";
import Navbar from "./ui/header/Navbar";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "./features/user/userSlice";
import axiosInstance from "./utils/axios.config";
import type { RootState } from "./store/store";

const MainLayout = () => {
  const dispatch = useDispatch();
  const user =  useSelector((store:RootState)=> store.user)
  const navigate = useNavigate()

    const hasAuthToken = () => {
    const cookies = document.cookie.split(';');
    return cookies.some(cookie => {
      const [name] = cookie.trim().split('=');
      return name === 'token'
    });
  }
  
    const fetchUser = async () => {

      if(user ) return
   
      if(!hasAuthToken()){
        //  console.log("user is not logged in")
         navigate("/login")
         return 
      }
      
       try {
        const res = await axiosInstance.get("/profile/view");
        // console.log("res :",res)
        dispatch(addUser(res.data.user));
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.log("Error : ", error);
        } else {
          console.log("Unexpected Error : ", error);
        }
      }
    };

    useEffect(()=>{
      fetchUser()
    },[])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
