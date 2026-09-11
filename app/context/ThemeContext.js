import React, { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState("light");

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
    };

    const themeStyles = {
        light: {
            isDark: false,
            background: "#FFFFFF",
            background2: "#f9f9f9",
            background3: "#f0f0f0",
            background4: "#f0f0f0",
            surface: "#FFFFFF",
            card: "#F8F8F8",
            inputBackground: "#F5F5F5",
            text: "#000000",
            text1: "#CCCCCC",
            subText: "#666666",
            muted: "#666666",
            cardBackground: "#F8F8F8",
            primary: "#4B0082",
            secondary: "#FFA500",
            accent: "#FF4500",
            border: "#E0E0E0",
            shadow: "#000000",
            line: "#5F5959"
        },
        dark: {
            isDark: true,
            background: "#121212",
            background2: "#1A1A1A",
            background3: "#2A2A2A",
            background4: "#2E2E2E",
            surface: "#1A1A1A",
            card: "#1E1E1E",
            inputBackground: "#2A2A2A",
            text: "#FFFFFF",
            text1: "#333333",
            subText: "#AAAAAA",
            muted: "#AAAAAA",
            cardBackground: "#1E1E1E",
            primary: "#4B0082",
            secondary: "#FF6347",
            accent: "#FFA07A",
            border: "#333333",
            shadow: "#FFFFFF",
            line: "#4B0082"
        },
    };


    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, themeStyles }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
