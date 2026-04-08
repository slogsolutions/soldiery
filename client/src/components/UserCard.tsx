import { addUserBackToFeed, removeUserFromFeed } from "@/features/feed/feedSlice";
import type { User } from "@/features/user/userSlice";
import axiosInstance from "@/utils/axios.config";
import type { RootState } from "../store/store";
import { FaGithub, FaGlobe, FaLinkedin } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

interface userCardProps {
  user : User
}

const UserCard = ({user}:userCardProps) => {
    const dispatch = useDispatch()

    const feed = useSelector((store:RootState) => store.feed)
 const handleFeedAction = async (status: string, userId: string) => {
   const userToRemove = feed.find(user => user._id === userId);
  dispatch(removeUserFromFeed(userId));
  
  try {
    await axiosInstance.post(`request/send/${status}/${userId}`);
  } catch (error: unknown) {
    // Rollback: User ko wapis feed mein daal do
    if (userToRemove) {
      dispatch(addUserBackToFeed(userToRemove));
    }
    console.log("Error:", error);
  }
};
  
  if(!user) return <div>User not found!!</div>
  
  const {_id,firstName,lastName,skills,gender,about,photoUrl,futureInterests,links} = user
  
  return (
    <div className="flex   justify-center bg-gray-100 p-4   w-auto">
      <div className="  bg-white p-4 pl-5 pr-5 w-[350px] shadow-2xl ">
        
          <div className="relative h-[300px] bg-gray-200">
        <img
          alt="img"
          src={photoUrl}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>
         {/* Name and Gender Section */}
      <div className="p-5 pb-3 flex justify-between items-start">
        <h2 className="text-3xl font-bold text-black">
          {firstName} {lastName}
        </h2>
        {gender && (
          <p className="text-lg font-bold text-slate-600 mt-2">{gender}</p>
        )}
      </div>

         <div className="px-5 pb-5">
                {skills && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Skills</p>
                    <p className="text-gray-800 font-medium">{skills + " "}</p>
                  </div>
                )}
        
                {about && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase">About</p>
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                      {about}
                    </p>
                  </div>
                )}
        
                {futureInterests && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Future Interest</p>
                    <p className="text-gray-900 font-medium">{futureInterests + " "}</p>
                  </div>
                )}
        
                {/* Links Section */}
                {links && (links.github || links.linkedin || links.portfolio) && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Links</p>
                    <div className="flex gap-3">
                      {links.github && (
                        <a
                          href={links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition"
                        >
                          <FaGithub className="w-5 h-5" />
                          <span className="text-sm font-medium">GitHub</span>
                        </a>
                      )}
                      
                      {links.linkedin && (
                        <a
                          href={links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition"
                        >
                          <FaLinkedin className="w-5 h-5" />
                          <span className="text-sm font-medium">LinkedIn</span>
                        </a>
                      )}
                      
                      {links.portfolio && (
                        <a
                          href={links.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition"
                        >
                          <FaGlobe className="w-5 h-5" />
                          <span className="text-sm font-medium">Portfolio</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

        <div className="flex gap-4 m-4 p-2">
          <button 
          onClick={() => handleFeedAction("ignored",_id)}
          className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-colors">Ignore</button>
            <button
           onClick={ () => handleFeedAction("interested",_id)}
           className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors">Interested</button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
