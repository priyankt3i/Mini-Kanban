// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#026AA7", // Trello blue
    },
    secondary: {
      main: "#5AAC44", // Trello green (for success actions)
    },
    background: {
      default: "#F4F5F7", // light gray background like Trello
      paper: "#FFFFFF",   // cards & app bar background
    },
    text: {
      primary: "#172B4D",
      secondary: "#5E6C84",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h6: {
      fontWeight: 700,
    },
    body2: {
      color: "#5E6C84",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#026AA7",
          boxShadow: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E0E0E0",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        },
      },
    },
  },
});

export default theme;
