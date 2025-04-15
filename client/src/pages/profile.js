import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { ThemeProvider, CssBaseline, Container, Typography, List, ListItem, ListItemText, IconButton, Box, Button } from "@mui/material";
import { AuthContext } from "../context/authContext";
import DeleteIcon from "@mui/icons-material/Delete";
import theme from "../components/theme";
import Navbar from "../components/navbar";
import axios from "axios";

function extractPrefix(email) {
    let match = email.match(/^[a-zA-Z0-9]+/);
    return match ? match[0] : "Guest"; // Default to "Guest" if no match
}

const capitalizeFirstLetter = (str) => {
    if (!str) return "";  // Handle empty or null strings
    return str.charAt(0).toUpperCase() + str.slice(1);
};

function DisplayUserName({ user }) {
    if (!user) { return; }
    const prefix = extractPrefix(user.email);
    return (<>
        <Typography variant="h2" sx={{  fontWeight: "bold", mb: 2, mt: 4}}>{capitalizeFirstLetter(prefix)}&#39;s Profile:</Typography>
    </>);
}

const Profile = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        if (!user) {
            navigate("/"); // Redirect to home page if user doesn't exist
        }
    }, [user, navigate]);

    const [selectedStateTax, setStateTax] = useState(null);
    const [file, setFile] = useState(null); 

    const stateTaxes = {
        "New_York_Tax": { "date": new Date(2025, 2, 20) },
        "New_Jersery_Tax": { "date": new Date(2025, 2, 19) },
        "Texas_Tax": { "date": new Date(2025, 2, 18) },
    };

    const handleSelectState = (taxKey) => {
        setStateTax(taxKey);
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a YAML file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("id", user._id);
        for (let pair of formData.entries()) {
            console.log(pair[0] + ":", pair[1]);
        }
        try {
            const response = await axios.post("http://localhost:8080/uploadStateTaxYaml", formData);

            console.log(response);
            if (response.status === 200) {
                alert("File uploaded successfully!");
            } else {
                alert("Failed to upload file.");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={"profile"} />
            <Container>
                <DisplayUserName user={user} />
                <Typography 
                    variant="h6" 
                    component="h5" 
                    gutterBottom 
                    sx={{ marginTop: 0, marginBottom: 2 }}
                >
                    Import State YAML:
                </Typography>

                {/* File Upload Section */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 5 }}>
                    <input type="file" accept=".yaml,.yml" onChange={handleFileChange} />
                    <Button 
                        color="secondary"
                        variant="contained"
                        sx={{ 
                            marginTop: 0, 
                            marginBottom: 5, 
                            textTransform: "none",
                            width: "fit-content"
                        }}
                        onClick={handleUpload}
                    >
                        Upload
                    </Button>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
                    <Typography variant="h6" component="h5" sx={{ marginRight: 2, fontWeight: "bold" }}>
                        Uploaded YAMLs:
                    </Typography>
                </Box>

                <Box sx={{ width: "45%" }}>
                    <List>
                        {Object.entries(stateTaxes).map(([key, value], index) => (
                            <ListItem 
                                key={key} 
                                sx={{
                                    backgroundColor: selectedStateTax === key ? "#A2E7D2" : (index % 2 === 0 ? "#BBBBBB" : "#D9D9D9"),
                                    "&:hover": {
                                        backgroundColor: selectedStateTax !== key ? "#B0B0B0" : "#A2E7D2",
                                    },
                                }}
                                onClick={() => handleSelectState(key)}
                            >
                                <ListItemText
                                    primary={<span style={{ fontWeight: "bold" }}>{key}</span>}
                                    secondary={`Date: ${value.date.toDateString()}`}
                                />
                                <IconButton 
                                    edge="end" 
                                    aria-label="delete" 
                                    onClick={() => alert(`Delete ${key}`)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default Profile;
