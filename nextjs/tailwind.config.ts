import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'IBMPlexSans': ["IBMPlexSansReg", 'sans-serif'],
        'IBMPlexSansLight': ["IBMPlexSansLight", 'sans-serif'],
        'IBMPlexSansSemiBold': ["IBMPlexSansSemiBold", 'sans-serif'],
        'IBMPlexSansMedium': ["IBMPlexSansMedium", 'sans-serif'],
        'IBMPlexSansCondensed': ["IBMPlexSansCondensed", 'sans-serif'],
        'IBMPlexMono': ["IBMPlexMono", 'sans-serif'],
        'PPRightGrotesk': ['PPRightGrotesk, sans-serif'],
        'publicSans': ['publicSans, sans-serif'],
        'publicSansVariable': ['publicSansVariable, sans-serif'],
      },
      fontSize: {
        hub6xl: ['3.625rem', {
          lineHeight: '110%',
          letterSpacing: '-0.145rem',
        }],
        hub5xl: ['2.86rem', {
          lineHeight: '110%',
          letterSpacing: '-0.11rem',
        }],
        hub4xl: ['2.44rem', {
          lineHeight: '110%',
          letterSpacing: '-0.1rem',
        }],
        hub3xl: ['1.75rem', {
          lineHeight: '110%',
          letterSpacing: '-0.04rem',
        }],
        hub2xl: ['1.5rem', {
          lineHeight: '110%',
          letterSpacing: '-0.015rem',
        }],
        hubxl: ['1.25rem', {
          lineHeight: '110%',
          letterSpacing: '0rem',
        }],

        hXlg: ['4.5rem', {
          lineHeight: '107%',
          letterSpacing: '-0.2rem',
        }],
        hXlgPP: ['4.7rem', {
          lineHeight: '107%',
          letterSpacing: '0rem',
        }],
        hLgPP: ['36px', {
          lineHeight: '100%',
          fontWeight: '700',
          letterSpacing: '0.05rem'
        }],
        hLg: ['36px', {
          lineHeight: '120%',
          fontWeight: '700',
        }],
        hMd: ['21px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        hSm: ['16px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        base: ['16px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '400',
        }],
        lg: ['20px', {
          lineHeight: '160%',
          letterSpacing: '0em',
        }],
        sm: ['14px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '400',
        }],
        tiny: ['12px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '400',
        }],
        labelMain: ['12px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        labelLg: ['14px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        labelXlg: ['16px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        dataName: ['13px', {
          lineHeight: '100%',
          letterSpacing: '0.65px',
          fontWeight: '500',
        }],
        dataResult: ['16px', {
          lineHeight: '100%',
          letterSpacing: '-0.32px',
          fontWeight: '400',
        }],

      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        bold: '800'
      },
      colors: {
        brandBlue: "hsl(var(--brand-blue))",
        white: "hsl(var(--white))",
        muted: "hsl(var(--meep-gray-600))",
        meepGray: {
          100: "hsl(var(--meep-gray-100))",
          200: "hsl(var(--meep-gray-200))",
          300: "hsl(var(--meep-gray-300))",
          400: "hsl(var(--meep-gray-400))",
          500: "hsl(var(--meep-gray-500))",
          600: "hsl(var(--meep-gray-600))",
          700: "hsl(var(--meep-gray-700))",
          800: "hsl(var(--meep-gray-800))",
        },
        buttonText: "hsl(var(--button-text))",
        labour: "hsl(var(--labour))",
        conservative: "hsl(var(--conservative))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        yellow: "hsl(var(--yellow))",
        darkSecondary: "hsl(var(--dark-secondary))",
        background: {
          DEFAULT: "hsl(var(--meepGray-800))",
          secondary: "hsl(var(--meepGray-700))",
          tertiary: "hsl(var(--meepGray-600))",
        },
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        "jungle-green": {
          '50': '#edfcf6',
          '100': '#d4f7e7',
          '200': '#aceed4',
          '300': '#76dfbb',
          '400': '#3fc89e',
          '500': '#1aa680',
          '600': '#0f8c6c',
          '700': '#0c705a',
          '800': '#0c5948',
          '900': '#0b493d',
          '950': '#052923',
          'neutral': '#6D6D6D',
          'bg': '#f2f2f2',
        },
        hub: {
          border: "#d4f7e7",
          input: "#76dfbb",
          ring: "#1aa680",
          background: "var(--background)",
          foreground: "#0b493d",
          primary: {
            DEFAULT: "var(--primary)",
            foreground: "var(--primary-foreground)",
            // Generated in JS and then embeded into DOM for later reference
            '50': "var(--primary-50)",
            '100': "var(--primary-100)",
            '200': "var(--primary-200)",
            '300': "var(--primary-300)",
            '400': "var(--primary-400)",
            '500': "var(--primary-500)",
            '600': "var(--primary-600)",
            '700': "var(--primary-700)",
            '800': "var(--primary-800)",
            '900': "var(--primary-900)",
            '950': "var(--primary-950)",
          },
          secondary: {
            DEFAULT: "var(--secondary)",
            foreground: "var(--secondary-foreground)",
            // Generated in JS and then embeded into DOM for later reference
            '50': "var(--secondary-50)",
            '100': "var(--secondary-100)",
            '200': "var(--secondary-200)",
            '300': "var(--secondary-300)",
            '400': "var(--secondary-400)",
            '500': "var(--secondary-500)",
            '600': "var(--secondary-600)",
            '700': "var(--secondary-700)",
            '800': "var(--secondary-800)",
            '900': "var(--secondary-900)",
            '950': "var(--secondary-950)",
          },
          text: {
            DEFAULT: "var(--text)",
            foreground: "var(--primary-foreground)",
          },
          destructive: {
            DEFAULT: "var(--destructive)",
            foreground: "var(--destructive-foreground)",
          },
          muted: {
            DEFAULT: "var(--muted)",
            foreground: "var(--muted-foreground)",
          },
          accent: {
            DEFAULT: "var(--accent)",
            foreground: "var(--accent-foreground)",
          },
          popover: {
            DEFAULT: "var(--popover)",
            foreground: "var(--popover-foreground)",
          },
          card: {
            DEFAULT: "var(--card)",
            foreground: "var(--card-foreground)",
          },
        }
      },
      boxShadow: {
        'hover': '0px 0px 30px 0px var(--hub-primary-300, #76DFBB)',
        'hub': '2px 2px 20px 0px var(--Jungle-Green-200, #ACEED4)',
      },
      spacing: {
        xs: '10px',
        sm: '15px',
        md: '20px',
        lg: '30px',

      },
      borderRadius: {
        lg: "calc(var(--radius))",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },

    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography')
  ],
} satisfies Config;

export default config;
