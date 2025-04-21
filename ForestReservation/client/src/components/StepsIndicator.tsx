import { Step } from "../types";

interface StepsIndicatorProps {
  currentStep: Step;
}

const StepsIndicator = ({ currentStep }: StepsIndicatorProps) => {
  return (
    <div className="mb-8 max-w-xl mx-auto py-4">
      <ol className="flex flex-row justify-center gap-6 md:gap-12 w-full">
        <li className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-14 h-14 text-lg font-bold ${currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"} rounded-full mb-2`}>
            1
          </div>
          <span className={`font-semibold ${currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : "text-gray-500"}`}>
            날짜 선택
          </span>
          {(currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation") && (
            <div className="w-full flex justify-center mt-1">
              <svg className="w-5 h-5 text-green-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </li>

        <li className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-14 h-14 text-lg font-bold ${currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"} rounded-full mb-2`}>
            2
          </div>
          <span className={`font-semibold ${currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : "text-gray-500"}`}>
            시간 선택
          </span>
          {(currentStep === "time" || currentStep === "info" || currentStep === "confirmation") && (
            <div className="w-full flex justify-center mt-1">
              <svg className="w-5 h-5 text-green-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </li>

        <li className="flex flex-col items-center">
          <div className={`flex items-center justify-center w-14 h-14 text-lg font-bold ${currentStep === "info" || currentStep === "confirmation" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"} rounded-full mb-2`}>
            3
          </div>
          <span className={`font-semibold ${currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : "text-gray-500"}`}>
            정보 입력
          </span>
          {(currentStep === "info" || currentStep === "confirmation") && (
            <div className="w-full flex justify-center mt-1">
              <svg className="w-5 h-5 text-green-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </li>
      </ol>
    </div>
  );
};

export default StepsIndicator;
