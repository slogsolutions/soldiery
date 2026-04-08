import type { User } from "@/features/user/userSlice";
import { FaGithub, FaLinkedin, FaGlobe } from "react-icons/fa";

interface ProfileCardProps {
  user: Partial<User>;
  showActions?: boolean;
  onChat?: () => void;
  onRemove?: () => void;
}

const ProfileCard = ({
  user,
  showActions = false,
  onChat,
  onRemove,
}: ProfileCardProps) => {
  const {
    firstName,
    lastName,
    about,
    gender,
    photoUrl,
    skills,
    futureInterests,
    links,
  } = user;

  // console.log("Links", links);

  return (
    <div className="bg-white w-full max-w-[380px] mx-auto shadow-xl rounded-2xl overflow-hidden">
      <div className="relative h-[300px] bg-gray-200">
        <img alt="img" src={photoUrl} className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Name and Gender Section */}
      <div className="p-5 pb-3 flex justify-between items-start">
        <h2 className="text-3xl font-bold text-black">
          {firstName} {lastName}
        </h2>
        {gender && (
          <p className="text-lg font-bold text-slate-800 mt-2">{gender}</p>
        )}
      </div>

      <div className="px-5 pb-5">
        {skills && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Skills
            </p>
            <p className="text-gray-800 font-medium">{skills + " "}</p>
          </div>
        )}
        {about && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              About
            </p>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
              {about}
            </p>
          </div>
        )}
        {futureInterests && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Future Interest
            </p>
            <p className="text-gray-900 font-medium">{futureInterests + " "}</p>
          </div>
        )}
        {/* Links Section */}
        {links && (links.github || links.linkedin || links.portfolio) && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Links
            </p>
            <div className="flex gap-3">
              {links.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-slate-800 hover:text-slate-950 transition"
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
                  className="flex items-center gap-1.5 text-slate-800 hover:text-slate-950 transition"
                >
                  <FaGlobe className="w-5 h-5" />
                  <span className="text-sm font-medium">Portfolio</span>
                </a>
              )}
            </div>
          </div>
        )}
        {/* This is  for show chat button and remove user button from connection page */}
        {showActions && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onChat}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition shadow-sm hover:shadow-md"
            >
              Chat
            </button>
            <button
              onClick={onRemove}
              className="flex-1 bg-rose-500 hover:bg-rose-700 text-white font-medium py-2.5 rounded-lg transition shadow-sm hover:shadow-md"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
