import React, { useContext } from "react";
import {
    ThemeProvider, CssBaseline, Container, Typography, List, ListItem, ListItemText, IconButton, Box, Button
} from "@mui/material";
import { AppContext, defaultInfo } from "../../context/appContext";
import { AuthContext } from "../../context/authContext";
import EditIcon from "@mui/icons-material/Edit";
import theme from "../../components/theme";
import Navbar from "../../components/navbar";
import { useNavigate } from "react-router-dom";
import ImportBtn from "./import-export/import";

const ScenarioList = () => {
    // const [ selectedScenario, setSelectedScenario] = useState(null); // Track selected scenario
    const { scenarioData, setScenarioData, setEditMode, setCurrScenario, setCurrInvestments, setCurrIncome, setCurrExpense, setCurrInvest, setCurrRebalance, setCurrInvestmentTypes } = useContext(AppContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    // console.log(user);

    const handleNewScenario = async () => {
        // Reset the app state for a new scenario
        setEditMode("new");
        setCurrScenario(defaultInfo);
        setCurrInvestments([]);
        setCurrInvestmentTypes([]);
        setCurrIncome([]);
        setCurrExpense([]);
        setCurrInvest([]);
        setCurrRebalance([]);

        // Navigate to the scenario basics form
        navigate("/scenario/basics");
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar currentPage={"scenarios"} />
            <Container>
                <Typography
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{ marginTop: 6, marginBottom: 2, fontWeight: "bold" }}
                >
                    Your Financial Journey
                </Typography>

                <Typography
                    variant="h6"
                    component="h5"
                    gutterBottom
                    sx={{ marginBottom: 1 }}
                >
                    Make a New Scenario
                </Typography>

                <Button
                    variant="contained"
                    sx={{ marginBottom: 6, textTransform: "none" }}
                    onClick={handleNewScenario}
                    disabled={user.guest && scenarioData.length >= 1}
                >
                    New Scenario
                </Button>

                <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
                    <Typography variant="h6" component="h5" sx={{ marginRight: 2 }}>
                        Existing Scenarios
                    </Typography>
                    
                    <ImportBtn/>

                    <Button 
                        variant="contained" 
                        color="secondary" // Uses the theme's secondary color
                        sx={{ textTransform: "none" }}
                        disabled={user.guest}
                    >
                        Share
                    </Button>
                </Box>

                <Box sx={{ display: "flex" }}>
                    <Box sx={{ width: "45%" }}>
                        <List>
                            {scenarioData != null && scenarioData.map((plan, index) => (
                                <ListItem
                                    key={plan._id}
                                    sx={{
                                        backgroundColor: index % 2 === 0 ? "#BBBBBB" : "#D9D9D9",
                                        "&:hover": {
                                            backgroundColor: "#B0B0B0"
                                        },
                                    }}
                                >
                                    <ListItemText
                                        primary={<span style={{ fontWeight: "bold" }}>{plan.name}</span>}
                                        secondary={`Goal: $${plan.financialGoal}`}
                                    />
                                    <IconButton
                                        edge="end"
                                        aria-label="edit"
                                        onClick={() => {
                                            setEditMode(plan._id); // Set edit mode to current plan ID
                                            navigate("/scenario/basics");
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default ScenarioList;
