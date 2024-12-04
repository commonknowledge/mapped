import { twMerge } from 'tailwind-merge'

export function TicketTailorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={twMerge('w-full', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 206 263"
    >
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M91 20c0 13.807-11.193 25-25 25-11.118 0-20.541-7.258-23.79-17.294L11.248 37.9C3.378 40.49-.9 48.97 1.69 56.838l64.238 195.118c2.59 7.869 11.07 12.148 18.938 9.557l31.198-10.271A24.988 24.988 0 01115 244c0-13.807 11.193-25 25-25 10.863 0 20.107 6.928 23.556 16.607l31.293-10.303c7.869-2.59 12.148-11.069 9.557-18.938L140.168 11.248C137.577 3.378 129.098-.9 121.23 1.69L89.715 12.066A24.97 24.97 0 0191 20zM42 73h65v19H83v67H65V92H42V73zm76 28H95v19h23v67h18v-67h24v-19h-42z"
        clipRule="evenodd"
      ></path>
    </svg>
  )
}
