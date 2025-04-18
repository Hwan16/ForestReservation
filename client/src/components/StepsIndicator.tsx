import { Step } from "../types";

interface StepsIndicatorProps {
  currentStep: Step;
}

const StepsIndicator = ({ currentStep }: StepsIndicatorProps) => {
  return (
    <div className="mb-8">
      <ol className="flex items-center text-sm font-medium text-center text-gray-500 sm:text-base">
        <li className={`flex md:w-full items-center ${currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "text-primary dark:text-primary" : ""}`}>
          <span className={`flex items-center justify-center w-8 h-8 mr-2 text-xs border ${currentStep === "date" || currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "border-primary bg-primary text-white" : "border-gray-300"} rounded-full shrink-0`}>
            1
          </span>
          날짜 <span className="hidden sm:inline-flex sm:ml-2">선택</span>
          <svg className="w-4 h-4 ml-2 sm:ml-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 5 4 4 6-8"/>
          </svg>
        </li>
        <li className={`flex md:w-full items-center ${currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "text-primary dark:text-primary" : ""}`}>
          <span className={`flex items-center justify-center w-8 h-8 mr-2 text-xs border ${currentStep === "time" || currentStep === "info" || currentStep === "confirmation" ? "border-primary bg-primary text-white" : "border-gray-300"} rounded-full shrink-0`}>
            2
          </span>
          시간 <span className="hidden sm:inline-flex sm:ml-2">선택</span>
          <svg className="w-4 h-4 ml-2 sm:ml-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 5 4 4 6-8"/>
          </svg>
        </li>
        <li className={`flex items-center ${currentStep === "info" || currentStep === "confirmation" ? "text-primary dark:text-primary" : ""}`}>
          <span className={`flex items-center justify-center w-8 h-8 mr-2 text-xs border ${currentStep === "info" || currentStep === "confirmation" ? "border-primary bg-primary text-white" : "border-gray-300"} rounded-full shrink-0`}>
            3
          </span>
          정보 <span className="hidden sm:inline-flex sm:ml-2">입력</span>
        </li>
      </ol>
    </div>
  );
};

export default StepsIndicator;
