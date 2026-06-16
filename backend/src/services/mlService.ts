import axios from "axios";

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  model_label: string;
}

const mlPredictUrl = (): string => {
  const base = (process.env.ML_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");
  return `${base}/predict`;
};

export const getPrediction = async (features: any): Promise<PredictionResponse> => {
  const response = await axios.post(mlPredictUrl(), features);
  return response.data;
};
