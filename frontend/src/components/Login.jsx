import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Button,
  Alert,
  Paper,
  Modal,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { LockOutlined, PersonOutlined } from "@mui/icons-material";

// Full page container
const FullScreenContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #fff7f0 0%, #f9e6d9 100%)", // Peach-cream gradient
  padding: theme.spacing(2),
  position: "relative",
  overflow: "hidden",
}));

// Styled login card
const LoginCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  maxWidth: "480px",
  borderRadius: theme.spacing(3),
  background: "linear-gradient(to bottom, #f9e6d9, #fff7f0)", // Peach-cream gradient
  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  color: "#4a3c31", // Dark tea brown
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
  },
}));

const Form = styled("form")({
  width: "100%",
  marginTop: "16px",
});

const SubmitButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  fontWeight: 600,
  fontSize: "1rem",
  textTransform: "none",
  backgroundColor: "#d8e2dc", // Muted tea green
  color: "#4a3c31", // Dark tea brown
  "&:hover": {
    backgroundColor: "#c8d4c9", // Darker tea green
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  },
  "&:disabled": {
    backgroundColor: "rgba(216,226,220,0.5)",
    color: "#4a3c31",
    opacity: 0.7,
  },
}));

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const canvasRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Glowing circles animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Circle properties
    const circles = [];
    const numCircles = 20;

    class Circle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 20 + 10;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(247,183,163,${this.opacity})`; // Soft coral with opacity
        ctx.shadowColor = "#ffccbc"; // Peach glow
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.closePath();
      }

      update() {
        this.x += this.dx;
        this.y += this.dy;

        // Bounce off edges
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
          this.dx = -this.dx;
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
          this.dy = -this.dy;
        }
      }
    }

    // Initialize circles
    for (let i = 0; i < numCircles; i++) {
      circles.push(new Circle());
    }

    // Animation loop
    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      circles.forEach((circle) => {
        circle.update();
        circle.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result && result.success) {
        toast.success("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 700);
      } 
      else {
        const errorMsg = result?.error || "Failed to sign in";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to sign in";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenContainer>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <LoginCard elevation={6}>
        <LockOutlined
          sx={{
            fontSize: 48,
            mb: 2,
            color: "#4a3c31", // Dark tea brown
            backgroundColor: "rgba(255,204,188,0.3)", // Peach with opacity
            padding: "10px",
            borderRadius: "50%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />
        <Typography
          component="h1"
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{
            color: "#4a3c31", // Dark tea brown
            textShadow: "1px 1px 2px rgba(0,0,0,0.15)",
          }}
        >
          Welcome Back
        </Typography>
        <Typography variant="body2" sx={{ color: "#4a3c31", opacity: 0.8, mb: 2 }}>
          Please login to continue
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              width: "100%",
              mb: 2,
              backgroundColor: "rgba(247,183,163,0.2)", // Soft coral with opacity
              color: "#4a3c31",
              "& .MuiAlert-icon": { color: "#4a3c31" },
            }}
          >
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <PersonOutlined sx={{ color: "#4a3c31", mr: 1 }} />
              ),
            }}
            sx={{
              "& .MuiInputBase-input": { color: "#4a3c31" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(74,60,49,0.4)" }, // Dark tea brown
                "&:hover fieldset": { borderColor: "#4a3c31" },
                "&.Mui-focused fieldset": { borderColor: "#f7b7a3" }, // Soft coral
              },
              "& .MuiInputLabel-root": { color: "rgba(74,60,49,0.7)" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#f7b7a3" },
            }}
          />

          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              "& .MuiInputBase-input": { color: "#4a3c31" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(74,60,49,0.4)" },
                "&:hover fieldset": { borderColor: "#4a3c31" },
                "&.Mui-focused fieldset": { borderColor: "#f7b7a3" },
              },
              "& .MuiInputLabel-root": { color: "rgba(74,60,49,0.7)" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#f7b7a3" },
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  value="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: "rgba(74,60,49,0.4)",
                    "&.Mui-checked": { color: "#f7b7a3" }, // Soft coral
                  }}
                />
              }
              label={<span style={{ color: "#4a3c31" }}>Remember me</span>}
            />

            <Button
              variant="text"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "#4a3c31",
                "&:hover": { color: "#f7b7a3" }, // Soft coral
              }}
              onClick={() => setForgotPasswordOpen(true)}
            >
              Forgot password?
            </Button>
          </Box>

          <SubmitButton
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </SubmitButton>
        </Form>
      </LoginCard>

      {/* Forgot Password Modal */}
      <Modal open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)}>
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 400 },
          p: 3,
          bgcolor: "linear-gradient(to bottom, #f9e6d9, #fff7f0)", // Peach-cream gradient
          borderRadius: 2,
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
          animation: "fadeIn 0.3s ease-in-out",
          background: "linear-gradient(to bottom, #f9e6d9, #fff7f0)",
          "@keyframes fadeIn": {
            "0%": { opacity: 0, transform: "translate(-50%, -60%)" },
            "100%": { opacity: 1, transform: "translate(-50%, -50%)" },
          },
        }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: "#4a3c31", fontWeight: "bold", textShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}
          >
            Forgot Password
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#4a3c31", opacity: 0.9, mb: 3 }}
          >
            Please contact the admin at{" "}
            <a
              href="mailto:zarin.helpdesk@gmail.com"
              style={{ color: "#f7b7a3", textDecoration: "none", fontWeight: "bold" }}
            >
              zarin.helpdesk@gmail.com
            </a>{" "}
            to reset your password.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setForgotPasswordOpen(false)}
            sx={{
              backgroundColor: "#d8e2dc", // Muted tea green
              color: "#4a3c31",
              fontWeight: "bold",
              borderRadius: 2,
              "&:hover": {
                backgroundColor: "#c8d4c9", // Darker tea green
                transform: "translateY(-2px)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
              },
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </FullScreenContainer>
  );
}