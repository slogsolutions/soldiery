import type { RootState } from "../store/store";
import { useSelector } from "react-redux";
import EditProfileCard from "@/components/EditProfileCard";

const Profile = () => {
  const user = useSelector((store: RootState) => {
    return store.user;
  });

  if (!user)
    return (
      <div className="text-center p-20 font-bold text-slate-800 text-3xl">
        Loading Profile...
      </div>
    );

  return <EditProfileCard user={user} />;
};

export default Profile;
