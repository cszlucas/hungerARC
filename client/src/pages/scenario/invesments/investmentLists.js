import React, { useState } from "react";
import {
  ThemeProvider, CssBaseline, Container, Typography, Button, Stack, 
  InputAdornment, Box, List, MenuItem, ListItem, ListItemText, 
  IconButton, Backdrop, Modal, Fade, TextField
} from '@mui/material';
import theme from '../../../components/theme';
import Navbar from '../../../components/navbar';
import PageHeader from '../../../components/pageHeader';
import {
  stackStyles, titleStyles, buttonStyles, rowBoxStyles, 
  backContinueContainerStyles, textFieldStyles
} from '../../../components/styles';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';  

const InvestmentLists = () => {
  const [open, setOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    investmentTypeName: '',
    taxType: '',
    value: '',
  });

  const [investments, setInvestments] = useState([
    { investmentTypeName: 'Apple', taxType: 'tax', value: '$50000' },
    { investmentTypeName: 'Microsoft', taxType: 'tax', value: '$70000' },
    { investmentTypeName: 'Amazon', taxType: 'tax', value: '$60000' },
    { investmentTypeName: 'IRA', taxType: 'pre', value: '$50000' },
    { investmentTypeName: '401k', taxType: 'pre', value: '$70000' },
    { investmentTypeName: 'Roth 401k', taxType: 'free', value: '$60000' },
    { investmentTypeName: 'Roth 403k', taxType: 'free', value: '$80000' },
  ]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewInvestment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddInvestment = () => {
    if (newInvestment.investmentTypeName && newInvestment.taxType && newInvestment.value) {
      setInvestments((prev) => [...prev, newInvestment]);
      setNewInvestment({ investmentTypeName: '', taxType: '', value: '' });
      handleClose();
    }
  };

  const handleDeleteInvestment = (index) => {
    const updatedInvestments = investments.filter((_, i) => i !== index);
    setInvestments(updatedInvestments);
  };

  const InvestList = ({ list, taxType }) => {
    const filteredInvestments = list.filter(item => item.taxType === taxType);

    return (
      <List>
        {filteredInvestments.map((item, index) => (
          <ListItem
            key={`${item.investmentTypeName}-${index}`}
            sx={{
              backgroundColor: index % 2 === 0 ? '#BBBBBB' : '#D9D9D9',
              '&:hover': { backgroundColor: '#B0B0B0' },
            }}
          >
            <ListItemText
              primary={<span style={{ fontWeight: 'bold' }}>{item.investmentTypeName}</span>}
              secondary={`Value: ${item.value}`}
            />
            
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => alert(`Edit ${item.investmentTypeName}`)}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleDeleteInvestment(investments.indexOf(item))}  // Delete the selected row
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar currentPage={''} />
      <Container>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={stackStyles}>
          <Typography variant="h2" component="h1" sx={titleStyles}>
            Investments
          </Typography>
          <Button variant="contained" color="secondary" sx={buttonStyles}>
            Save
          </Button>
        </Stack>

        <PageHeader />

        <Box sx={{ marginBottom: 1, display: "flex", justifyContent: "flex-end" }}>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ fontSize: '1.1rem', textTransform: 'none' }}
            onClick={handleOpen}
          >
            Add
          </Button>
        </Box>

        <Box sx={rowBoxStyles}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Taxable</Typography>
            <InvestList list={investments} taxType="tax" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Tax-Deferred</Typography>
            <InvestList list={investments} taxType="pre" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Tax-Free</Typography>
            <InvestList list={investments} taxType="free" />
          </Box>
        </Box>

        <Box sx={backContinueContainerStyles}>
          <Button variant="contained" color="primary" sx={buttonStyles}>
            Back
          </Button>
          <Button variant="contained" color="success" sx={buttonStyles}>
            Continue
          </Button>
        </Box>

        {/* Backdrop + Modal */}
        <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1300 }}>
          <Fade in={open}>
            <Box
              onClick={(e) => e.stopPropagation()}  
              sx={{
                backgroundColor: 'white',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                minWidth: 400,
                maxWidth: 800,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Typography variant="h5">Add New Investment</Typography>
              
              <Box>
                <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                  Investment Name
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                  <TextField
                    select
                    name="investmentTypeName"
                    value={newInvestment.investmentTypeName}
                    onChange={handleChange}
                    sx={textFieldStyles}
                    fullWidth
                  >
                    <MenuItem value="JAWS">JAWS</MenuItem>
                    <MenuItem value="Roth IRA">Roth IRA</MenuItem>
                    <MenuItem value="Hunger Finance">Hunger Finance</MenuItem>
                  </TextField>
                  <Button variant="contained" color="primary" onClick={handleClose} sx={{textTransform: 'none', minWidth: 150}}>
                    Add Custom Type
                  </Button>
                </Box>
              </Box>

              <Box sx={rowBoxStyles}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                    Tax Status of account
                  </Typography>
                  <TextField
                    select
                    name="taxType"
                    value={newInvestment.taxType}
                    onChange={handleChange}
                    sx={textFieldStyles}
                    fullWidth
                  >
                    <MenuItem value="tax">Taxable</MenuItem>
                    <MenuItem value="pre">Tax-Deferred</MenuItem>
                    <MenuItem value="free">Tax-Free</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 'medium' }}>
                    Value
                  </Typography>
                  <TextField
                    type="number"
                    name="value"
                    value={newInvestment.value}
                    onChange={handleChange}
                    sx={textFieldStyles}
                    fullWidth
                    InputProps={{  
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="contained" color="primary" onClick={handleClose} sx={{textTransform: 'none'}}>
                  Cancel
                </Button>
                <Button variant="contained" color="secondary" onClick={handleAddInvestment} sx={{textTransform: 'none'}}>
                  Save
                </Button>
              </Box>
            </Box>
          </Fade>
        </Backdrop>
      </Container>
    </ThemeProvider>
  );
};

export default InvestmentLists;
