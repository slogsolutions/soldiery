import {
  removeRequestFromFeed,
  setRequests,
} from "@/features/request/requestsSlice";
import axiosInstance from "@/utils/axios.config";
import type { RootState } from "../store/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const Requests = () => {
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const fetchedRequests = async () => {
    try {
      const res = await axiosInstance.get("/user/requests/recieved");
      dispatch(setRequests(res.data.data));
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

  const reviewRequest = async (status: string, id: string) => {
    try {
      await axiosInstance.post("/request/review/" + status + "/" + id);
      dispatch(removeRequestFromFeed(id));
    } catch (error: unknown) {
      console.log("Error during reviewRequest : ", error);
    }
  };

  useEffect(() => {
    fetchedRequests();
  }, []);

  const requests = useSelector((store: RootState) => store.requests);

  if (!requests) return null;
  if (requests.length === 0)
    return (
      <p className="text-slate-600 text-2xl text-center">No requests found</p>
    );

  return (
    <div className="flex flex-col gap-5  py-4">
      <h1 className="text-slate-700 text-3xl text-center font-bold">Requests</h1>

      {error && (
        <div className="max-w-md mx-auto w-full p-4 bg-red-900/20 border border-red-600 rounded-lg">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </div>
      )}

      {requests.map((requestObj) => {
        const { photoUrl, firstName, lastName, skills } = requestObj.fromUserId;

        return (
          <div
            key={requestObj._id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 border border-gray-600 rounded-lg bg-gray-900 shadow-md w-full max-w-md mx-auto"
          >
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:flex-1">
              <div className="flex-shrink-0">
                <div className="w-[60px] h-[60px] sm:w-[50px] sm:h-[50px] rounded-full overflow-hidden border-2 border-gray-500 flex items-center justify-center">
                  <img
                    src={photoUrl || "https://via.placeholder.com/50"}
                    alt={firstName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://via.placeholder.com/50";
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold truncate">
                  {firstName} {lastName}
                </h2>

                <div className="max-h-[3rem] overflow-hidden mt-1">
                  <p className="text-gray-300 text-sm break-words line-clamp-2">
                    {skills && skills.length > 0
                      ? skills.join(", ")
                      : "No skills available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0 sm:ml-auto">
              <button
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-3 py-2 sm:py-1.5 rounded transition"
                onClick={() => reviewRequest("rejected", requestObj._id)}
              >
                Reject
              </button>
              <button
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 py-2 sm:py-1.5 rounded transition"
                onClick={() => reviewRequest("accepted", requestObj._id)}
              >
                Accept
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Requests;
