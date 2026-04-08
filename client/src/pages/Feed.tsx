import UserCard from "@/components/UserCard";
import axiosInstance from "@/utils/axios.config";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { useEffect, useState } from "react";
import { setFeed } from "@/features/feed/feedSlice";

const Feed = () => {
  const feed = useSelector((store: RootState) => store.feed);
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  const getFeed = async () => {
    if (feed && feed.length > 0) return;
    try {
      const res = await axiosInstance.get("/user/feed");
      dispatch(setFeed(res.data.users));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
        console.error("Feed Error:", error.message);
      } else {
        setError("An unexpected error occurred");
        console.error("Unknown Error:", error);
      }
    }
  };

  useEffect(() => {
    getFeed();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <p className="text-slate-700 text-lg">{error}</p>
        <button
          onClick={() => {
            setError(null);
            getFeed();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">No users found in feed</p>
      </div>
    );
  }

  return (
    <div>
      {feed.map((user) => {
        return <UserCard key={user._id} user={user} />;
      })}
    </div>
  );
};

export default Feed;
