import { Step } from "../types";

interface StepsIndicatorProps {
  currentStep: Step;
}

const StepsIndicator = ({ currentStep }: StepsIndicatorProps) => {
  return (
    <div className="mb-8 max-w-4xl mx-auto py-4">
      <ol className="flex items-center justify-between w-full text-sm font-medium text-center text-gray-500 sm:text-base">
        <li className={`flex flex-col items-center justify-center ${currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : ""}`}>
          <span className={`flex items-center justify-center w-10 h-10 mb-2 text-base border-2 ${currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "border-green-600 bg-green-600 text-white" : "border-gray-300"} rounded-full shrink-0`}>
            1
          </span>
          <div className="text-center">
            <p className="font-semibold">날짜 선택</p>
          </div>
          {(currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation") && (
            <div className="w-full flex justify-center mt-2">
              <svg className="w-5 h-5 text-green-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </li>
        
        <div className="w-full mx-2 bg-gray-200 h-0.5 hidden md:block"></div>
        
        <li className={`flex flex-col items-center justify-center ${currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : ""}`}>
          <span className={`flex items-center justify-center w-10 h-10 mb-2 text-base border-2 ${currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "border-green-600 bg-green-600 text-white" : "border-gray-300"} rounded-full shrink-0`}>
            2
          </span>
          <div className="text-center">
            <p className="font-semibold">시간 선택</p>
          </div>
          {(currentStep === "time" || currentStep === "info" || currentStep === "confirmation") && (
            <div className="w-full flex justify-center mt-2">
              <svg className="w-5 h-5 text-green-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </li>
        
        <div className="w-full mx-2 bg-gray-200 h-0.5 hidden md:block"></div>
        
        <li className={`flex flex-col items-center justify-center ${currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : ""}`}>
          <span className={`flex items-center justify-center w-10 h-10 mb-2 text-base border-2 ${currentStep === "info" || currentStep === "confirmation" ? "border-green-600 bg-green-600 text-white" : "border-gray-300"} rounded-full shrink-0`}>
            3
          </span>
          <div className="text-center">
            <p className="font-semibold">정보 입력</p>
          </div>
          {(currentStep === "info" || currentStep === "confirmation") && (
            <div className="w-full flex justify-center mt-2">
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
