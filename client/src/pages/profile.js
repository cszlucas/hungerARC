import React, { useContext, useState } from "react";
import { ThemeProvider, CssBaseline, Container, Typography, List, ListItem, ListItemText, IconButton, Box, Button } from "@mui/material";
import { AuthContext } from "../context/authContext";
import DeleteIcon from "@mui/icons-material/Delete";
import theme from "../components/theme";
import Navbar from "../components/navbar";

function extractPrefix(email) {
    let match = email.match(/^[a-zA-Z0-9]+/);
    return match ? match[0] : "Guest"; // Default to "Guest" if no match
}

function DisplayUserName({ user }) {
    if (!user) return <h1>Hello weirdo!</h1>;
    const prefix = extractPrefix(user.email);
    return <h1>{prefix || "Guest"}&#39;s Profile:</h1>;
}

const Profile = () => {
    const { user } = useContext(AuthContext);
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

        try {
            const response = await fetch("http://localhost:8080/getStateYaml", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
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
            <Navbar currentPage={"homepage"} />
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
                    <Typography variant="h6" component="h5" sx={{ marginRight: 2 }}>
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
