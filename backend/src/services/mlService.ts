// import axios from "axios";
//
// export interface PredictionResponse {
//   prediction: string;
//   confidence: number;
// }
//
// export const getPrediction = async (
//   duration: number,
//   srcBytes: number,
//   dstBytes: number
// ): Promise<PredictionResponse> => {
//
//   const response = await axios.post(
//     process.env.ML_SERVICE_URL || "http://localhost:8000/predict",
//     {
//       duration,
//       src_bytes: srcBytes,
//       dst_bytes: dstBytes,
//     }
//   );
//   return response.data;
// };


import axios from "axios";

export interface PredictionResponse {
  prediction: string;
  confidence: number;
}

export const getPrediction = async (features: any): Promise<PredictionResponse> => {
  const response = await axios.post(
    `${process.env.ML_SERVICE_URL}/predict` || "http://localhost:8000/predict",
    features
  );

  return response.data;
};
