import { Step } from "../types";

interface StepsIndicatorProps {
  currentStep: Step;
}

const StepsIndicator = ({ currentStep }: StepsIndicatorProps) => {
  return (
    <div className="mb-8 max-w-4xl mx-auto py-4">
      <ol className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0 w-full text-gray-500 sm:text-base">
        <li className={`flex items-center ${currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : ""} w-full`}>
          <span className={`flex items-center justify-center w-10 h-10 mr-3 text-base border-2 ${currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "border-green-600 bg-green-600 text-white" : "border-gray-300"} rounded-full shrink-0`}>
            1
          </span>
          <span className="font-semibold text-lg">날짜 선택</span>
          {(currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation") && (
            <svg className="w-5 h-5 text-green-600 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </li>
        
        <li className={`flex items-center ${currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : ""} w-full`}>
          <span className={`flex items-center justify-center w-10 h-10 mr-3 text-base border-2 ${currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "border-green-600 bg-green-600 text-white" : "border-gray-300"} rounded-full shrink-0`}>
            2
          </span>
          <span className="font-semibold text-lg">시간 선택</span>
          {(currentStep === "time" || currentStep === "info" || currentStep === "confirmation") && (
            <svg className="w-5 h-5 text-green-600 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </li>
        
        <li className={`flex items-center ${currentStep === "info" || currentStep === "confirmation" ? "text-green-700" : ""} w-full`}>
          <span className={`flex items-center justify-center w-10 h-10 mr-3 text-base border-2 ${currentStep === "info" || currentStep === "confirmation" ? "border-green-600 bg-green-600 text-white" : "border-gray-300"} rounded-full shrink-0`}>
            3
          </span>
          <span className="font-semibold text-lg">정보 입력</span>
          {(currentStep === "info" || currentStep === "confirmation") && (
            <svg className="w-5 h-5 text-green-600 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </li>
      </ol>
    </div>
  );
};

export default StepsIndicator;
