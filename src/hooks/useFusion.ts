import { useState } from "react";
import axios from "axios"; // Import Axios library

type PayloadProps = {
  columns: number;
  rows: number;
  borderWidth: number;
  borderColor: string;
  data: { motion: string; mint: string }[];
};

const useFusion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const doFusion = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `https://api.dinoherd.cc/queue-job/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          // timeout: 300000, // Set the timeout to 6 seconds (adjust as needed)
          // signal: AbortSignal.timeout(300000),
          // responseType: "arraybuffer", // Specify the response type as arraybuffer
        }
      );

      if (response.status !== 200) {
        throw new Error("Collage upload failed.");
      }

      setIsLoading(false);

      return response; // Return the Axios response object
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      throw err; // Re-throw the error for the caller to handle
    }
  };

  const uploadAudio = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`https://api.dinoherd.cc/audio`, {
        headers: {
          "Content-Type": "application/json",
        },
        // timeout: 300000, // Set the timeout to 6 seconds (adjust as needed)
        // signal: AbortSignal.timeout(300000),
        // responseType: "arraybuffer", // Specify the response type as arraybuffer
      });

      if (response.status !== 200) {
        throw new Error("Collage upload failed.");
      }

      setIsLoading(false);

      return response; // Return the Axios response object
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      throw err; // Re-throw the error for the caller to handle
    }
  };

  const jobStatus = async (id: string) => {
    try {
      const response = await axios.get(
        `https://api.dinoherd.cc/job-progress/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error("Job status check failed");
      }

      return response; // Return the Axios response object
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw the error for the caller to handle
    }
  };

  return { doFusion, jobStatus, isLoading, error };
};

export default useFusion;
